FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 3010

RUN groupadd -g 1001 appgroup && useradd -u 1001 -g appgroup -s /bin/sh -m appuser
RUN chown -R appuser:appgroup /app
USER appuser

CMD ["sh", "-c", "cd /app/src && uvicorn main:app --host 0.0.0.0 --port 3010"]
