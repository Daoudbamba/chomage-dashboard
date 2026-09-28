import psycopg

from .config import DATABASE_URL

SCHEMA_SQL = """
CREATE TABLE IF NOT EXISTS taux_chomage_departement (
    code TEXT NOT NULL,
    libelle TEXT NOT NULL,
    annee INT NOT NULL,
    trimestre INT NOT NULL,
    taux NUMERIC(4,1) NOT NULL,
    PRIMARY KEY (code, libelle, annee, trimestre)
);

CREATE TABLE IF NOT EXISTS taux_chomage_region (
    code TEXT NOT NULL,
    libelle TEXT NOT NULL,
    annee INT NOT NULL,
    trimestre INT NOT NULL,
    taux NUMERIC(4,1) NOT NULL,
    PRIMARY KEY (code, libelle, annee, trimestre)
);
"""


def get_connection():
    return psycopg.connect(DATABASE_URL, autocommit=True)


def init_schema():
    with get_connection() as conn:
        conn.execute(SCHEMA_SQL)


def is_empty() -> bool:
    with get_connection() as conn:
        row = conn.execute("SELECT count(*) FROM taux_chomage_departement").fetchone()
        return row[0] == 0
