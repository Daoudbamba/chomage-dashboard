import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from .db import get_connection, init_schema, is_empty
from .etl import run_etl

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_schema()
    if is_empty():
        logger.info("Base vide, lancement de l'ETL initial...")
        run_etl()
    yield


app = FastAPI(title="Observatoire du chômage — API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

TABLES = {
    "departement": "taux_chomage_departement",
    "region": "taux_chomage_region",
}


def _table_for(niveau: str) -> str:
    table = TABLES.get(niveau)
    if table is None:
        raise HTTPException(status_code=400, detail="niveau doit être 'departement' ou 'region'")
    return table


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.post("/api/refresh")
def refresh():
    return run_etl()


@app.get("/api/entites")
def entites(niveau: str = Query("departement")):
    table = _table_for(niveau)
    with get_connection() as conn:
        rows = conn.execute(f"SELECT DISTINCT code, libelle FROM {table} ORDER BY libelle").fetchall()
    return [{"code": r[0], "libelle": r[1]} for r in rows]


@app.get("/api/serie")
def serie(niveau: str = Query("departement"), code: str = Query(...), libelle: str = Query(None)):
    table = _table_for(niveau)
    with get_connection() as conn:
        if libelle:
            rows = conn.execute(
                f"SELECT annee, trimestre, taux FROM {table} WHERE code = %s AND libelle = %s ORDER BY annee, trimestre",
                (code, libelle),
            ).fetchall()
        else:
            rows = conn.execute(
                f"SELECT annee, trimestre, taux FROM {table} WHERE code = %s ORDER BY annee, trimestre",
                (code,),
            ).fetchall()
    return [{"annee": r[0], "trimestre": r[1], "taux": float(r[2])} for r in rows]


@app.get("/api/latest")
def latest(niveau: str = Query("departement")):
    table = _table_for(niveau)
    with get_connection() as conn:
        period = conn.execute(f"SELECT annee, trimestre FROM {table} ORDER BY annee DESC, trimestre DESC LIMIT 1").fetchone()
        if not period:
            return {"periode": None, "valeurs": []}
        annee, trimestre = period
        rows = conn.execute(
            f"SELECT code, libelle, taux FROM {table} WHERE annee = %s AND trimestre = %s ORDER BY taux DESC",
            (annee, trimestre),
        ).fetchall()
    return {
        "periode": {"annee": annee, "trimestre": trimestre},
        "valeurs": [{"code": r[0], "libelle": r[1], "taux": float(r[2])} for r in rows],
    }


@app.get("/api/summary")
def summary():
    with get_connection() as conn:
        period = conn.execute(
            "SELECT annee, trimestre FROM taux_chomage_region ORDER BY annee DESC, trimestre DESC LIMIT 1"
        ).fetchone()
        if not period:
            raise HTTPException(status_code=503, detail="Données non encore chargées")
        annee, trimestre = period

        national = conn.execute(
            """SELECT taux FROM taux_chomage_region
               WHERE libelle = 'FRANCE METROPOLITAINE' AND annee = %s AND trimestre = %s""",
            (annee, trimestre),
        ).fetchone()

        prev_trimestre, prev_annee = (trimestre - 1, annee) if trimestre > 1 else (4, annee - 1)
        national_prev = conn.execute(
            """SELECT taux FROM taux_chomage_region
               WHERE libelle = 'FRANCE METROPOLITAINE' AND annee = %s AND trimestre = %s""",
            (prev_annee, prev_trimestre),
        ).fetchone()

        extremes = conn.execute(
            """SELECT libelle, taux FROM taux_chomage_departement
               WHERE annee = %s AND trimestre = %s
               ORDER BY taux ASC LIMIT 1""",
            (annee, trimestre),
        ).fetchone()
        extremes_max = conn.execute(
            """SELECT libelle, taux FROM taux_chomage_departement
               WHERE annee = %s AND trimestre = %s
               ORDER BY taux DESC LIMIT 1""",
            (annee, trimestre),
        ).fetchone()

        first_period = conn.execute(
            "SELECT annee, trimestre FROM taux_chomage_region ORDER BY annee ASC, trimestre ASC LIMIT 1"
        ).fetchone()

    return {
        "periode": {"annee": annee, "trimestre": trimestre},
        "taux_national": float(national[0]) if national else None,
        "taux_national_precedent": float(national_prev[0]) if national_prev else None,
        "departement_min": {"libelle": extremes[0], "taux": float(extremes[1])} if extremes else None,
        "departement_max": {"libelle": extremes_max[0], "taux": float(extremes_max[1])} if extremes_max else None,
        "depuis": {"annee": first_period[0], "trimestre": first_period[1]} if first_period else None,
    }
