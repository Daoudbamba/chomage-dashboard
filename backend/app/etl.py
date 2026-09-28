import logging
import re
from pathlib import Path

import httpx
import pandas as pd

from .config import DOWNLOAD_TIMEOUT_SECONDS, FALLBACK_XLS_PATH, INSEE_SOURCE_URL
from .db import get_connection

logger = logging.getLogger("etl")

QUARTER_COL_RE = re.compile(r"^T([1-4])_(\d{4})$")

# Row ranges are stable for this INSEE workbook layout: a 3-row title block,
# a header row at index 3, then data rows until a blank separator + source notes.
DEPARTEMENT_SHEET = "Département"
DEPARTEMENT_DATA_RANGE = (4, 104)
REGION_SHEET = "Région"
REGION_DATA_RANGE = (4, 23)


def fetch_workbook(dest: Path) -> Path:
    """Try to refresh the source file from INSEE; fall back to the bundled snapshot on any failure."""
    try:
        response = httpx.get(INSEE_SOURCE_URL, timeout=DOWNLOAD_TIMEOUT_SECONDS, follow_redirects=True)
        response.raise_for_status()
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_bytes(response.content)
        logger.info("Fichier INSEE téléchargé (%d octets)", len(response.content))
        return dest
    except Exception as exc:  # noqa: BLE001 - any network/parsing failure should fall back gracefully
        logger.warning("Téléchargement INSEE impossible (%s), utilisation du snapshot local", exc)
        return FALLBACK_XLS_PATH


def _parse_sheet(xls_path: Path, sheet_name: str, data_range: tuple[int, int]) -> pd.DataFrame:
    raw = pd.read_excel(xls_path, sheet_name=sheet_name, header=None)
    header = raw.iloc[3]
    start, end = data_range
    df = raw.iloc[start:end].copy()
    df.columns = header
    df = df.rename(columns={df.columns[0]: "code", df.columns[1]: "libelle"})
    df["code"] = df["code"].astype(str).str.strip()
    df["libelle"] = df["libelle"].astype(str).str.strip()

    quarter_cols = [c for c in df.columns[2:] if isinstance(c, str) and QUARTER_COL_RE.match(c)]
    long_df = df.melt(id_vars=["code", "libelle"], value_vars=quarter_cols, var_name="periode", value_name="taux")
    long_df = long_df.dropna(subset=["taux"])

    parsed = long_df["periode"].str.extract(QUARTER_COL_RE)
    long_df["trimestre"] = parsed[0].astype(int)
    long_df["annee"] = parsed[1].astype(int)
    long_df["taux"] = long_df["taux"].astype(float)

    return long_df.drop(columns=["periode"]).reset_index(drop=True)


def parse_departements(xls_path: Path) -> pd.DataFrame:
    return _parse_sheet(xls_path, DEPARTEMENT_SHEET, DEPARTEMENT_DATA_RANGE)


def parse_regions(xls_path: Path) -> pd.DataFrame:
    return _parse_sheet(xls_path, REGION_SHEET, REGION_DATA_RANGE)


def _upsert(table: str, df: pd.DataFrame) -> int:
    if df.empty:
        return 0
    rows = list(df[["code", "libelle", "annee", "trimestre", "taux"]].itertuples(index=False, name=None))
    sql = f"""
        INSERT INTO {table} (code, libelle, annee, trimestre, taux)
        VALUES (%s, %s, %s, %s, %s)
        ON CONFLICT (code, libelle, annee, trimestre) DO UPDATE SET taux = EXCLUDED.taux
    """
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.executemany(sql, rows)
    return len(rows)


def run_etl() -> dict:
    workbook_path = fetch_workbook(FALLBACK_XLS_PATH.parent / "insee_latest.xls")
    departements = parse_departements(workbook_path)
    regions = parse_regions(workbook_path)

    n_dept = _upsert("taux_chomage_departement", departements)
    n_region = _upsert("taux_chomage_region", regions)

    logger.info("ETL terminé : %d lignes département, %d lignes région", n_dept, n_region)
    return {"departements": n_dept, "regions": n_region}


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    from .db import init_schema

    init_schema()
    print(run_etl())
