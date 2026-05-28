import { getBackendSrv } from '@grafana/runtime';
import { AlertRule, AlertState, PromRulesResponse } from './types';

function normalizeState(raw?: string): AlertState {
  switch ((raw || '').toLowerCase()) {
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

export async function fetchAlertRules(): Promise<AlertRule[]> {
  const resp: PromRulesResponse = await getBackendSrv().get('/api/prometheus/grafana/api/v1/rules');

  const out: AlertRule[] = [];
  for (const group of resp.data?.groups ?? []) {
    for (const rule of group.rules ?? []) {
      if (rule.type !== 'alerting') {
        continue;
      }
      out.push({
        name: rule.name,
        query: rule.query,
        state: normalizeState(rule.state),
        health: rule.health,
        labels: rule.labels ?? {},
        annotations: rule.annotations ?? {},
        group: group.name,
        folder: group.file,
        lastEvaluation: rule.lastEvaluation,
      });
    }
  }
  return out;
}
