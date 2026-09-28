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
cd backend
pip install -r requirements-dev.txt
pytest -v
```

Les tests couvrent la logique de transformation (reshape wide→long, gestion des valeurs
manquantes, doublons de codes région) sur un classeur de test synthétique — pas sur le fichier
INSEE réel, pour rester rapides et déterministes.

## Source des données

Insee, estimations de taux de chômage localisés (série CVS, moyenne trimestrielle).
Champ : France métropolitaine jusqu'au 1ᵉʳ trimestre 2014, France entière (hors Mayotte) ensuite.
