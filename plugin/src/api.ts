import { getBackendSrv } from '@grafana/runtime';
import { AlertRule, AlertState, PromRulesResponse } from './types';

function normalizeState(raw?: string): AlertState {
  switch ((raw || '').toLowerCase()) {
    case 'alerting':
    case 'firing':
      return 'firing';
    case 'pending':
      return 'pending';
    case 'nodata':
    case 'no_data':
      return 'nodata';
    case 'error':
      return 'error';
    case 'inactive':
    case 'normal':
    case 'ok':
      return 'normal';
    default:
      return 'normal';
  }
}

export interface FetchAlertsOptions {
  // Plugin-side states already selected by the user. Only the ones that map
  // cleanly to Grafana's `state` query param (firing/pending/normal→inactive)
  // are pushed to the server to reduce payload size. nodata/error are kept
  // client-side because they live under `health` and AND-ing state+health
  // server-side would zero-out the result.
  states?: AlertState[];
  files?: string[];     // Grafana folder names (Prometheus rule "file")
  matchers?: string[];  // PromQL-style matcher expressions: {label="value"}
  limitAlerts?: number; // cap on instances per rule (0 = no cap)
}

function buildQuery(opts?: FetchAlertsOptions): string {
  if (!opts) {
    return '';
  }
  const params = new URLSearchParams();

  if (opts.states && opts.states.length > 0) {
    const stateMap: Partial<Record<AlertState, string>> = {
      firing: 'firing',
      pending: 'pending',
      normal: 'inactive',
    };
    const mapped = opts.states.map((s) => stateMap[s]).filter((v): v is string => !!v);
    // Only push when the entire selection maps to state-class filters; if the
    // user also picked nodata/error, skip server-side to avoid AND-empty.
    if (mapped.length === opts.states.length) {
      mapped.forEach((s) => params.append('state', s));
    }
  }

  opts.files?.forEach((f) => f && params.append('file', f));
  opts.matchers?.forEach((m) => m && params.append('matcher', m));
  if (opts.limitAlerts && opts.limitAlerts > 0) {
    params.set('limit_alerts', String(opts.limitAlerts));
  }

  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

export async function fetchAlertRules(opts?: FetchAlertsOptions): Promise<AlertRule[]> {
  const url = '/api/prometheus/grafana/api/v1/rules' + buildQuery(opts);
  const resp: PromRulesResponse = await getBackendSrv().get(url);

  // One card per alert instance: each entry in rule.alerts[] is a distinct
  // alert (one per label combination) with its own state/labels/annotations
  // — and Grafana has already resolved template variables in those annotations.
  const out: AlertRule[] = [];
  for (const group of resp.data?.groups ?? []) {
    for (const rule of group.rules ?? []) {
      if (rule.type !== 'alerting') {
        continue;
      }
      for (const alert of rule.alerts ?? []) {
        out.push({
          name: rule.name,
          query: rule.query,
          state: normalizeState(alert.state),
          health: rule.health,
          labels: alert.labels ?? {},
          annotations: alert.annotations ?? {},
          group: group.name,
          folder: group.file,
          lastEvaluation: rule.lastEvaluation,
        });
      }
    }
  }
  return out;
}
