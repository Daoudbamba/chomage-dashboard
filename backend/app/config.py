import os
from pathlib import Path

DATABASE_URL = os.environ.get(
    "DATABASE_URL", "postgresql://chomage:chomage@localhost:5439/chomage"
)

INSEE_SOURCE_URL = os.environ.get(
    "INSEE_SOURCE_URL",
    "https://www.insee.fr/fr/statistiques/fichier/2012804/sl_etc_2026T2.xls",
)

BACKEND_DIR = Path(__file__).resolve().parent.parent
FALLBACK_XLS_PATH = BACKEND_DIR / "data" / "insee_taux_chomage_localise.xls"

DOWNLOAD_TIMEOUT_SECONDS = float(os.environ.get("INSEE_DOWNLOAD_TIMEOUT", "10"))
