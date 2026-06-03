import React from 'react';
import { css } from '@emotion/css';
import { Icon, Tooltip } from '@grafana/ui';
import { AlertRule } from '../types';

interface Props {
  alert: AlertRule;
  color: string;
  showExpression: boolean;
  showFooter: boolean;
  borderRadius: number;
  compact: boolean;
  maxHeight: number;
  minHeight: number;
  subtitleKeys: string[];
  tooltipKeys: string[];
}

export const AlertCard: React.FC<Props> = ({
  alert,
  color,
  showExpression,
  showFooter,
  borderRadius,
  compact,
  maxHeight,
  minHeight,
  subtitleKeys,
  tooltipKeys,
}) => {
  const hasTemplate = (s?: string) => !!s && s.includes('{{');
  const resolved = (key: string): string | undefined => {
    const v = alert.annotations[key];
    return v && !hasTemplate(v) ? v : undefined;
  };

  const subtitleLines = subtitleKeys.map(resolved).filter((v): v is string => !!v);
  const tooltipLines = tooltipKeys.map(resolved).filter((v): v is string => !!v);
  const tooltipContent =
    tooltipLines.length > 0 ? (
      <div>
        {tooltipLines.map((line, i) => (
          <div key={i}>{line}</div>
        ))}
      </div>
    ) : (
      'Sem informação disponível.'
    );

  const runbookUrl = alert.annotations.runbook_url || alert.annotations.runbookUrl;
  const severity = alert.labels.severity;

  const styles = getStyles(color, borderRadius, compact, maxHeight, minHeight);

  return (
    <div className={styles.card}>
      <div className={styles.accent} />

      <div className={styles.header}>
        <div className={styles.titleWrap}>
          <Tooltip content={tooltipContent} placement="top">
            <span className={styles.title}>{alert.name}</span>
          </Tooltip>
          {subtitleLines.map((line, i) => (
            <span key={i} className={styles.summary}>
              {line}
            </span>
          ))}
          <div className={styles.meta}>
            <span className={styles.state}>{alert.state.toUpperCase()}</span>
            {severity && <span className={styles.badge}>{severity}</span>}
            {alert.group && <span className={styles.badgeMuted}>{alert.group}</span>}
          </div>
        </div>

        {runbookUrl && (
          <a
            className={styles.runbook}
            href={runbookUrl}
            target="_blank"
            rel="noreferrer"
            title="Abrir Runbook"
            aria-label="Abrir Runbook"
          >
            <Icon name="book" size="lg" />
          </a>
        )}
      </div>

      {showExpression && (
        <pre className={styles.expr} title={alert.query}>
          <code>{alert.query}</code>
        </pre>
      )}

      {showFooter && (
        <div className={styles.footer}>
          <Icon name="clock-nine" size="sm" />
          <span>{alert.lastEvaluation ? new Date(alert.lastEvaluation).toLocaleString() : '—'}</span>
        </div>
      )}
    </div>
  );
};

const getStyles = (color: string, radius: number, compact: boolean, maxHeight: number, minHeight: number) => ({
  card: css`
    position: relative;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid ${color}55;
    border-radius: ${radius}px;
    padding: ${compact ? '10px 12px 8px' : '16px 18px 12px'};
    display: flex;
    flex-direction: column;
    gap: ${compact ? '6px' : '10px'};
    overflow: hidden;
    ${maxHeight > 0 ? `max-height: ${maxHeight}px;` : ''}
    ${minHeight > 0 ? `min-height: ${minHeight}px;` : ''}
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.18);
    transition: transform 120ms ease, box-shadow 120ms ease, border-color 120ms ease;
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px ${color}55;
      border-color: ${color};
    }
  `,
  accent: css`
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 6px;
    background: linear-gradient(180deg, ${color}, ${color}99);
  `,
  header: css`
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    padding-left: 8px;
  `,
  titleWrap: css`
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
  `,
  title: css`
    font-weight: 600;
    font-size: 15px;
    line-height: 1.25;
    color: var(--card-fg, #f0f0f0);
    cursor: help;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
  `,
  summary: css`
    font-weight: 400;
    font-size: 12px;
    line-height: 1.3;
    color: rgba(255, 255, 255, 0.7);
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
  `,
  meta: css`
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    align-items: center;
  `,
  state: css`
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.08em;
    color: ${color};
  `,
  badge: css`
    font-size: 10px;
    font-weight: 600;
    padding: 2px 8px;
    border-radius: 999px;
    background: ${color}33;
    color: ${color};
    text-transform: uppercase;
  `,
  badgeMuted: css`
    font-size: 10px;
    font-weight: 500;
    padding: 2px 8px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.06);
    color: rgba(255, 255, 255, 0.65);
  `,
  runbook: css`
    color: ${color};
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
    padding: 4px 6px;
    transition: background 120ms ease;
    &:hover {
      background: ${color}22;
    }
  `,
  expr: css`
    margin: 0 0 0 8px;
    background: rgba(0, 0, 0, 0.35);
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 6px;
    padding: 8px 10px;
    font-family: 'Roboto Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 11px;
    line-height: 1.45;
    color: #d4d4dc;
    white-space: pre-wrap;
    word-break: break-all;
    max-height: 96px;
    overflow: auto;
  `,
  footer: css`
    display: flex;
    align-items: center;
    gap: 6px;
    padding-left: 8px;
    font-size: 11px;
    color: rgba(255, 255, 255, 0.55);
  `,
});
