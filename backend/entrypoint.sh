#!/usr/bin/env bash
set -e

# Wait for Postgres
echo "Waiting for Postgres at ${DB_HOST}:${DB_PORT:-5432}..."
until python - <<'PYCODE'
import os, sys, time
import psycopg2
host = os.getenv("DB_HOST", "db")
port = os.getenv("DB_PORT", "5432")
user = os.getenv("DB_USER", "postgres")
password = os.getenv("DB_PASSWORD", "")
dbname = os.getenv("DB_NAME", "")
for _ in range(60):
    try:
        psycopg2.connect(host=host, port=port, user=user, password=password, dbname=dbname).close()
        sys.exit(0)
    except Exception:
        time.sleep(1)
sys.exit(1)
PYCODE
do
  echo "Postgres not ready yet..."
  sleep 1
done
echo "Postgres is ready."

# Apply migrations automatically (no manual steps needed)
echo "Applying database migrations..."
python manage.py migrate --noinput

# Create superuser if it doesn’t exist
echo "Ensuring Django superuser exists..."
python manage.py shell <<'PYCODE'
import os
from django.contrib.auth import get_user_model

User = get_user_model()
username = os.getenv("DJANGO_SUPERUSER_USERNAME", "admin")
email = os.getenv("DJANGO_SUPERUSER_EMAIL", "admin@example.com")
password = os.getenv("DJANGO_SUPERUSER_PASSWORD", "admin")

if not User.objects.filter(username=username).exists():
    print(f"Creating superuser {username}...")
    User.objects.create_superuser(username=username, email=email, password=password)
else:
    print(f"Superuser {username} already exists.")
PYCODE

# Optional: collect static in dev only if you serve admin static via Django
# echo "Collecting static files..."
# python manage.py collectstatic --noinput

# Start Django dev server
echo "Starting Django..."
exec python manage.py runserver 0.0.0.0:8000
