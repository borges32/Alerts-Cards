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

      // Only an active (firing/pending) instance has template variables
      // (e.g. {{ $labels.x }}, {{ $value }}) resolved against real series.
      // A normal-state instance expands them to "[no value]"/empty, so we
      // ignore it and keep the rule-level (templated) annotations instead —
      // the card hides any summary that still contains "{{".
      // Note: instance-level state is Grafana-style ("Alerting"/"Pending"/
      // "Normal"), not the Prometheus-style rule state ("firing").
      const instances = rule.alerts ?? [];
      const isActive = (s?: string) => {
        const v = (s || '').toLowerCase();
        return v === 'alerting' || v === 'firing' || v === 'pending';
      };
      const activeInstance =
        instances.find((a) => ['alerting', 'firing'].includes((a.state || '').toLowerCase())) ??
        instances.find((a) => isActive(a.state));

      out.push({
        name: rule.name,
        query: rule.query,
        state: normalizeState(rule.state),
        health: rule.health,
        labels: { ...(rule.labels ?? {}), ...(activeInstance?.labels ?? {}) },
        annotations: { ...(rule.annotations ?? {}), ...(activeInstance?.annotations ?? {}) },
        group: group.name,
        folder: group.file,
        lastEvaluation: rule.lastEvaluation,
      });
    }
  }
  return out;
}
