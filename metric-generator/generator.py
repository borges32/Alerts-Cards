"""
Generates synthetic metrics that oscillate so the provisioned alerts
(firing / pending / normal) actually transition between states.
"""
import math
import os
import random
import time

from opentelemetry import metrics
from opentelemetry.exporter.otlp.proto.grpc.metric_exporter import OTLPMetricExporter
from opentelemetry.sdk.metrics import MeterProvider
from opentelemetry.sdk.metrics.export import PeriodicExportingMetricReader
from opentelemetry.sdk.resources import Resource

resource = Resource.create({"service.name": "cart-service", "service.namespace": "shop"})

exporter = OTLPMetricExporter(
    endpoint=os.environ.get("OTEL_EXPORTER_OTLP_ENDPOINT", "http://otel-collector:4317"),
    insecure=True,
)
reader = PeriodicExportingMetricReader(exporter, export_interval_millis=5000)
provider = MeterProvider(resource=resource, metric_readers=[reader])
metrics.set_meter_provider(provider)

meter = metrics.get_meter("cart.generator")

cart_open = meter.create_gauge(
    "cart_open_total",
    description="Number of currently open shopping carts",
    unit="1",
)
cart_abandoned = meter.create_gauge(
    "cart_abandoned_rate",
    description="Rate of carts abandoned in the last minute",
    unit="1",
)
checkout_latency = meter.create_gauge(
    "checkout_latency_seconds",
    description="Checkout latency in seconds",
    unit="s",
)
error_rate = meter.create_gauge(
    "http_error_rate",
    description="HTTP 5xx error rate",
    unit="1",
)

print("Metric generator started, exporting to", exporter._endpoint)

t = 0
while True:
    # Sinusoidal so alerts go through all the states
    base = (math.sin(t / 12.0) + 1) / 2  # 0..1

    cart_open.set(50 + int(base * 200), {"region": "br-east"})
    cart_abandoned.set(round(base * 0.9 + random.uniform(-0.05, 0.05), 3), {"region": "br-east"})
    checkout_latency.set(round(0.2 + base * 4.5, 2), {"endpoint": "/checkout"})
    error_rate.set(round(base * 0.15 + random.uniform(0, 0.02), 4), {"endpoint": "/checkout"})

    t += 1
    time.sleep(5)
