import React, { useEffect, useMemo, useState } from 'react';
import { css } from '@emotion/css';
import { PanelProps } from '@grafana/data';
import { Alert, LoadingPlaceholder } from '@grafana/ui';
import { AlertCardsOptions, AlertRule } from '../types';
import { fetchAlertRules } from '../api';
import { AlertCard } from './AlertCard';

interface Props extends PanelProps<AlertCardsOptions> {}

const POLL_INTERVAL_MS = 15000;

export const AlertCardsPanel: React.FC<Props> = ({ options, width, height }) => {
  const [rules, setRules] = useState<AlertRule[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const data = await fetchAlertRules();
        if (!cancelled) {
          setRules(data);
          setError(null);
        }
      } catch (e: unknown) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : String(e));
        }
      }
    };
    load();
    const id = window.setInterval(load, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  const filtered = useMemo(() => {
    if (!rules) {
      return [];
    }
    let result = rules;

    // 1. Filtro por estado (multi-select). Vazio = todos.
    if (options.stateFilter && options.stateFilter.length > 0) {
      const allowed = new Set(options.stateFilter);
      // `inactive` é tratado como `normal` para fins de filtro
      if (allowed.has('normal')) {
        allowed.add('inactive');
      }
      result = result.filter((r) => allowed.has(r.state));
    }

    // 2. Filtro por grupo (regex)
    const groupFilter = options.groupFilter?.trim();
    if (groupFilter) {
      try {
        const re = new RegExp(groupFilter, 'i');
        result = result.filter((r) => re.test(r.group ?? ''));
      } catch {
        /* regex inválida ignora o filtro */
      }
    }

    // 3. Filtro por label: `key=regex` ou regex sobre `k=v,k=v`
    const labelFilter = options.labelFilter?.trim();
    if (labelFilter) {
      const kv = labelFilter.match(/^([\w.\-/]+)\s*=\s*(.+)$/);
      if (kv) {
        const [, key, pattern] = kv;
        try {
          const re = new RegExp(pattern);
          result = result.filter((r) => re.test(r.labels[key] ?? ''));
        } catch {
          /* noop */
        }
      } else {
        try {
          const re = new RegExp(labelFilter);
          result = result.filter((r) => {
            const joined = Object.entries(r.labels)
              .map(([k, v]) => `${k}=${v}`)
              .join(',');
            return re.test(joined);
          });
        } catch {
          /* noop */
        }
      }
    }

    return result;
  }, [rules, options.stateFilter, options.groupFilter, options.labelFilter]);

  const colorFor = (state: AlertRule['state']): string => {
    switch (state) {
      case 'firing':
        return options.colorFiring;
      case 'pending':
        return options.colorPending;
      case 'nodata':
        return options.colorNoData;
      case 'error':
        return options.colorError;
      default:
        return options.colorNormal;
    }
  };

  const styles = getStyles(options.columns, options.gap, width, height, options.cardMaxHeight);

  if (error) {
    return (
      <Alert title="Falha ao carregar alertas" severity="error">
        {error}
      </Alert>
    );
  }
  if (rules === null) {
    return <LoadingPlaceholder text="Carregando alertas..." />;
  }
  if (filtered.length === 0) {
    if (options.hideEmptyGroups) {
      return null;
    }
    return (
      <div className={styles.empty}>
        <span>Nenhum alerta encontrado.</span>
      </div>
    );
  }

  const severityOrder: Record<AlertRule['state'], number> = {
    firing: 0,
    pending: 1,
    nodata: 2,
    error: 3,
    normal: 4,
    inactive: 4,
  };
  const sorted = [...filtered].sort((a, b) => {
    switch (options.sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'lastEvaluation': {
        const ta = a.lastEvaluation ? Date.parse(a.lastEvaluation) : 0;
        const tb = b.lastEvaluation ? Date.parse(b.lastEvaluation) : 0;
        return tb - ta;
      }
      case 'severity':
      default:
        return severityOrder[a.state] - severityOrder[b.state] || a.name.localeCompare(b.name);
    }
  });

  return (
    <div className={styles.grid}>
      {sorted.map((rule, idx) => (
        <AlertCard
          key={`${rule.group}-${rule.name}-${idx}`}
          alert={rule}
          color={colorFor(rule.state)}
          showExpression={options.showExpression}
          showFooter={options.showFooter}
          borderRadius={options.borderRadius}
          compact={options.compact}
          maxHeight={options.cardMaxHeight}
          minHeight={options.cardMinHeight}
        />
      ))}
    </div>
  );
};

const getStyles = (columns: number, gap: number, width: number, height: number, cardMaxHeight: number) => ({
  grid: css`
    width: ${width}px;
    height: ${height}px;
    overflow: auto;
    display: grid;
    grid-template-columns: repeat(${columns}, minmax(0, 1fr));
    grid-auto-rows: ${cardMaxHeight > 0 ? `minmax(0, ${cardMaxHeight}px)` : 'min-content'};
    align-content: start;
    gap: ${gap}px;
    padding: 4px;
    box-sizing: border-box;
  `,
  empty: css`
    display: flex;
    align-items: center;
    justify-content: center;
    height: ${height}px;
    color: rgba(255, 255, 255, 0.6);
    font-style: italic;
  `,
});
