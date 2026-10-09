# Observatoire du chômage en France

Dashboard d'analyse du taux de chômage localisé en France (région/département), à partir des
données publiques de l'INSEE (série trimestrielle CVS depuis 1982).

## Pourquoi ce projet

Compléter mon portfolio avec un projet "Data Analyst" bout en bout : ingestion de données
publiques réelles, modélisation, API, et restitution visuelle — en complément de mon
[assistant documentaire RAG](https://github.com/Daoudbamba/docs-ai-assistant) plus orienté IA générative.

## Architecture

- **ETL** (`backend/app/etl.py`) : télécharge le classeur INSEE (taux de chômage localisés par
  région et département), reformate les données du format large (une colonne par trimestre) vers
  un format long, et les charge dans PostgreSQL. Si la source INSEE est indisponible, l'ETL
  retombe automatiquement sur un instantané local versionné (`backend/data/`).
- **API** (`backend/app/main.py`) : FastAPI, expose les séries temporelles, le classement des
  départements et des indicateurs clés (KPIs).
- **Frontend** (`frontend/`) : Next.js + Recharts — KPIs, courbe d'évolution région vs national,
  classement des départements.

```
Excel INSEE → pandas (reshape wide → long) → PostgreSQL → FastAPI → Next.js/Recharts
```

## Lancer le projet

```bash
docker compose up --build
```

- Frontend : http://localhost:3010
- API : http://localhost:8010/api/summary

Au premier démarrage, le backend charge automatiquement les données (ETL) si la base est vide.

## Tests

```bash
# Backend (pytest)
cd backend
python3 -m venv .venv
. .venv/bin/activate
pip install -r requirements-dev.txt
pytest -v

# Frontend (Vitest)
cd ../frontend
npm install
npm run test:ci
```

Les tests couvrent :

- la logique ETL backend (reshape wide→long, valeurs manquantes, cohérence des lignes nationales/régionales) ;
- les utilitaires frontend d'insights (variation trimestrielle, formatage, génération des messages clés).

## CI/CD

Le pipeline GitHub Actions est défini dans [CI](.github/workflows/ci.yml) et s'exécute sur chaque push/PR vers `main`.

- Job 1 : tests backend (`pytest -v`)
- Job 2 : tests frontend (`npm run test:ci`) + build Next.js (`npm run build`)

L'objectif est de bloquer les régressions fonctionnelles et visuelles avant merge.

## Source des données

Insee, estimations de taux de chômage localisés (série CVS, moyenne trimestrielle).
Champ : France métropolitaine jusqu'au 1ᵉʳ trimestre 2014, France entière (hors Mayotte) ensuite.
