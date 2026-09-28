FROM python:3.12-slim

WORKDIR /app

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/app ./app
COPY backend/test ./tests

# Imagen production-shaped: sin --reload. El override de DEV (docker-compose.dev.yml)
# reintroduce --reload + bind-mount del código para hot reload en desarrollo.
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]

