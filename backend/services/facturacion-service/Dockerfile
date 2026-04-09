FROM python:3.11-slim-bullseye

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    libxmlsec1-dev \
    libxmlsec1-openssl \
    pkg-config \
    gcc \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 3010

RUN groupadd -g 1001 appgroup && useradd -u 1001 -g appgroup -s /bin/sh -m appuser
RUN chown -R appuser:appgroup /app
USER appuser

CMD ["sh", "-c", "cd /app/src && uvicorn main:app --host 0.0.0.0 --port 3010"]
