FROM python:3.12-slim

WORKDIR /app

RUN pip install --no-cache-dir \
    opentelemetry-api==1.27.0 \
    opentelemetry-sdk==1.27.0 \
    opentelemetry-exporter-otlp==1.27.0

COPY generator.py .

CMD ["python", "-u", "generator.py"]
