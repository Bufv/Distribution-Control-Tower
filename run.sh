#!/usr/bin/env bash
set -euo pipefail

echo "=== Executive Distribution Control Tower ==="
echo ""

case "${1:-help}" in
  dev)
    echo "[1/3] Installing Python deps..."
    pip install -r backend/requirements.txt -q

    echo "[2/3] Running Alembic migrations..."
    cd backend && alembic upgrade head && cd ..

    echo "[3/3] Starting FastAPI dev server..."
    uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
    ;;

  seed)
    echo "Running data generator once..."
    cd backend && python -m data_generator.main && cd ..
    ;;

  docker)
    docker compose up --build -d
    echo "Services started. Backend: http://localhost:8000 | Frontend: http://localhost"
    ;;

  docker-stop)
    docker compose down
    ;;

  cron)
    cat <<'CRON'
Add to crontab (crontab -e):
  */5 * * * * cd /path/to/project && docker compose run --rm data-generator
CRON
    ;;

  verify)
    source /tmp/venv/bin/activate 2>/dev/null || python3 -m venv /tmp/venv && source /tmp/venv/bin/activate
    pip install -r backend/requirements.txt -q
    python verify_local.py
    ;;

  *)
    echo "Usage: $0 {dev|seed|docker|docker-stop|cron|verify|help}"
    echo ""
    echo "  dev         — Start FastAPI locally (PostgreSQL must be running)"
    echo "  seed        — Run data generator once"
    echo "  docker      — Start all services via Docker Compose"
    echo "  docker-stop — Stop Docker Compose services"
    echo "  cron        — Print crontab command for periodic data generation"
    echo "  verify      — Run local verification (SQLite)"
    ;;
esac
