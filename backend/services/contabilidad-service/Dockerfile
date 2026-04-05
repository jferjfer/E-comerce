FROM python:3.11-alpine

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN addgroup -g 1001 -S python && \
    adduser -S contabilidad -u 1001
RUN chown -R contabilidad:python /app
USER contabilidad

EXPOSE 3012

CMD ["sh", "-c", "cd /app/src && uvicorn main:app --host 0.0.0.0 --port 3012"]
