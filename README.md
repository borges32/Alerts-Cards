# Alerts Cards - Grafana Panel Plugin

A Grafana panel plugin that renders **Alert Rules** as elegant cards, respecting severity colors, with description hover, runbook link, and rich visual customization.

## Features

- Cards showing the alert **summary**, **expression (script)** and **state**
- Card color reflects the alert state (`firing`, `pending`, `normal`, `no_data`, `error`)
- **Hover** reveals the full `description` annotation
- Clickable book icon that opens the alert's **Runbook URL**
- Multi-select **state filter** (e.g. show only `firing` + `pending`)
- Regex **label filter** and regex **group filter**
- Configurable **sort order** (severity, name, last evaluation)
- Per-card **max/min height** so a single card does not stretch the whole panel
- Custom **color palette** for every state
- Layout controls: columns, gap, border radius, compact mode

## Project layout

```text
cart_alert/
├── docker-compose.yml          # Stack: Grafana + Prometheus + OTel Collector + metric generator
├── provisioning/               # Provisioned datasources, alert rules, dashboards
├── prometheus/                 # Prometheus config
├── otel/                       # OpenTelemetry Collector config
├── metric-generator/           # Container that pushes OTLP metrics
└── plugin/                     # Grafana plugin (TypeScript + React)
```

## Quick start

```bash
# 1. Build the plugin
cd plugin
npm install
npm run build
cd ..

# 2. Bring the stack up
docker compose up -d

# 3. Open Grafana
# http://localhost:3000  (admin / admin)
```

The plugin is loaded in "unsigned dev" mode via the Grafana env var
`GF_PLUGINS_ALLOW_LOADING_UNSIGNED_PLUGINS=alerts-cards-panel`.

Create a new panel and pick **Alerts Cards** as the visualization, or open the
provisioned dashboard *"Cart Alerts Overview"*.

> **Important:** build the plugin **before** the first `docker compose up`.
> See [docs/BUILD.md](docs/BUILD.md) for details — the bind-mount of
> `./plugin/dist` into the Grafana container will create an empty folder owned
> by root if `dist/` does not exist yet, and Grafana will fail to register the
> plugin.

## Panel options

### Layout

| Option | Default | Description |
| --- | --- | --- |
| Columns | `3` | Cards per row (1–6) |
| Gap (px) | `16` | Space between cards |
| Border radius (px) | `12` | Card corner radius |
| Compact mode | `off` | Tighter padding and spacing |
| Card max height (px) | `220` | Caps card height. `0` = unlimited (a single card will not stretch the whole panel) |
| Card min height (px) | `0` | Forces a minimum card height. `0` = fits content |

### Content

| Option | Default | Description |
| --- | --- | --- |
| Show expression | `on` | Display the alert's PromQL expression inside the card |
| Show footer | `on` | Display the "last evaluation" footer |

### Filters

| Option | Default | Description |
| --- | --- | --- |
| Filter by state | all | Multi-select. Pick one or more of `firing`, `pending`, `normal`, `nodata`, `error`. Empty = show all |
| Filter by label | — | `key=regex` (e.g. `severity=critical`) or a regex tested against `key=value,...` |
| Filter by group | — | Regex matched against the alert rule group name |
| Sort by | `severity` | `severity`, `name`, or `lastEvaluation` (most recent first) |
| Hide when empty | `on` | Renders nothing if the current filters produce no matches |

### Colors

A color picker for each state: **Firing**, **Pending**, **Normal/Inactive**,
**No Data**, **Error**. The chosen color is applied to the card accent bar,
border on hover, state label and severity badge.

## Data source

The panel calls the Grafana internal API
(`/api/prometheus/grafana/api/v1/rules`) — it returns every alert rule managed
by Grafana itself, so no data source needs to be attached to the panel.
Data refreshes every 15 seconds.

## Documentation

- [docs/BUILD.md](docs/BUILD.md) — build instructions, Docker volume gotchas, dev workflow, troubleshooting.
