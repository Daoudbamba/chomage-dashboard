from pathlib import Path

import pandas as pd
import pytest

from app.etl import parse_departements, parse_regions

FIXTURES_DIR = Path(__file__).parent / "fixtures"


@pytest.fixture(scope="module")
def sample_xls(tmp_path_factory):
    """Build a tiny workbook mirroring the real INSEE layout: 3 title rows,
    a header row, a couple of data rows, then a blank row + footer text."""
    path = tmp_path_factory.mktemp("data") / "sample.xls"

    dept_rows = [
        ["Estimations de taux de chômage localisé", None, None, None],
        ["(en%)", None, None, None],
        [None, None, None, None],
        ["Code", "Libellé", "T1_2024", "T2_2024"],
        ["01", "AIN", 5.0, 5.2],
        ["75", "PARIS", 7.1, None],
        [None, None, None, None],
        ["Données CVS, en moyenne trimestrielle (en %).", None, None, None],
    ]
    # pad to reach the expected slice range (rows 4..8 as data for this fixture)
    while len(dept_rows) < 9:
        dept_rows.append([None, None, None, None])

    region_rows = [
        ["Estimations de taux de chômage localisé : comparaisons régionales", None, None, None],
        ["(en%)", None, None, None],
        [None, None, None, None],
        ["Code", "Libellé", "T1_2024", "T2_2024"],
        ["00", "FRANCE METROPOLITAINE", 7.5, 7.4],
        ["11", "ILE-DE-FRANCE", 6.9, 6.8],
        [None, None, None, None],
        ["Champ : France entière.", None, None, None],
    ]
    while len(region_rows) < 8:
        region_rows.append([None, None, None, None])

    with pd.ExcelWriter(path) as writer:
        pd.DataFrame(dept_rows).to_excel(writer, sheet_name="Département", header=False, index=False)
        pd.DataFrame(region_rows).to_excel(writer, sheet_name="Région", header=False, index=False)

    return path


def test_parse_departements_reshapes_to_long_format(sample_xls, monkeypatch):
    import app.etl as etl

    monkeypatch.setattr(etl, "DEPARTEMENT_DATA_RANGE", (4, 6))
    df = parse_departements(sample_xls)

    assert set(df.columns) == {"code", "libelle", "trimestre", "annee", "taux"}
    assert len(df) == 3  # AIN has 2 quarters, PARIS has 1 (T2 is NaN and dropped)

    ain_t1 = df[(df.code == "01") & (df.trimestre == 1)].iloc[0]
    assert ain_t1.annee == 2024
    assert ain_t1.taux == 5.0

    paris_rows = df[df.code == "75"]
    assert len(paris_rows) == 1
    assert paris_rows.iloc[0].trimestre == 1


def test_parse_regions_keeps_national_reference_row(sample_xls, monkeypatch):
    import app.etl as etl

    monkeypatch.setattr(etl, "REGION_DATA_RANGE", (4, 6))
    df = parse_regions(sample_xls)

    national = df[df.libelle == "FRANCE METROPOLITAINE"]
    assert len(national) == 2
    assert set(national.taux) == {7.5, 7.4}
