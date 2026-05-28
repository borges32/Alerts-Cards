export type AlertState = 'firing' | 'pending' | 'inactive' | 'normal' | 'nodata' | 'error';

export const ALL_ALERT_STATES: AlertState[] = ['firing', 'pending', 'normal', 'nodata', 'error'];

export interface AlertCardsOptions {
  columns: number;
  showExpression: boolean;
  labelFilter: string;
  stateFilter: AlertState[];
  groupFilter: string;
  sortBy: 'severity' | 'name' | 'lastEvaluation';
  hideEmptyGroups: boolean;
  colorFiring: string;
  colorPending: string;
  colorNormal: string;
  colorNoData: string;
  colorError: string;
  borderRadius: number;
  gap: number;
  compact: boolean;
  showFooter: boolean;
  cardMaxHeight: number;
  cardMinHeight: number;
}

export const defaultOptions: AlertCardsOptions = {
  columns: 3,
  showExpression: true,
  labelFilter: '',
  stateFilter: [...ALL_ALERT_STATES],
  groupFilter: '',
  sortBy: 'severity',
  hideEmptyGroups: true,
  colorFiring: '#E02F44',
  colorPending: '#FF9830',
  colorNormal: '#3BA55D',
  colorNoData: '#8E8E8E',
  colorError: '#7E2EC9',
  borderRadius: 12,
  gap: 16,
  compact: false,
  showFooter: true,
  cardMaxHeight: 220,
  cardMinHeight: 0,
};

export interface AlertRule {
  name: string;
  query: string;
  state: AlertState;
  health?: string;
  labels: Record<string, string>;
  annotations: Record<string, string>;
  group: string;
  folder?: string;
  lastEvaluation?: string;
}

export interface PromRulesResponse {
  status: string;
  data: {
    groups: Array<{
      name: string;
      file?: string;
      folderUid?: string;
      rules: Array<{
        name: string;
        query: string;
        state?: string;
        health?: string;
        type: string;
        labels?: Record<string, string>;
        annotations?: Record<string, string>;
        lastEvaluation?: string;
        alerts?: Array<{
          state?: string;
          labels?: Record<string, string>;
          annotations?: Record<string, string>;
          activeAt?: string;
          value?: string;
        }>;
      }>;
    }>;
  };
}
