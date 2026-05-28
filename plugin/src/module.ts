import { PanelPlugin } from '@grafana/data';
import { ALL_ALERT_STATES, AlertCardsOptions, defaultOptions } from './types';
import { AlertCardsPanel } from './components/AlertCardsPanel';

const stateOptions = ALL_ALERT_STATES.map((s) => ({
  value: s,
  label: s.charAt(0).toUpperCase() + s.slice(1),
}));

export const plugin = new PanelPlugin<AlertCardsOptions>(AlertCardsPanel).setPanelOptions((builder) => {
  builder
    // ---------- Layout ----------
    .addSliderInput({
      path: 'columns',
      name: 'Colunas',
      description: 'Quantidade de cards por linha',
      defaultValue: defaultOptions.columns,
      settings: { min: 1, max: 6, step: 1 },
      category: ['Layout'],
    })
    .addNumberInput({
      path: 'gap',
      name: 'Espaçamento entre cards (px)',
      defaultValue: defaultOptions.gap,
      category: ['Layout'],
    })
    .addNumberInput({
      path: 'borderRadius',
      name: 'Raio das bordas (px)',
      defaultValue: defaultOptions.borderRadius,
      category: ['Layout'],
    })
    .addBooleanSwitch({
      path: 'compact',
      name: 'Modo compacto',
      defaultValue: defaultOptions.compact,
      category: ['Layout'],
    })
    .addNumberInput({
      path: 'cardMaxHeight',
      name: 'Altura máxima do card (px)',
      description: 'Limita a altura de cada card. Use 0 para não limitar.',
      defaultValue: defaultOptions.cardMaxHeight,
      settings: { min: 0, max: 1000, step: 10 },
      category: ['Layout'],
    })
    .addNumberInput({
      path: 'cardMinHeight',
      name: 'Altura mínima do card (px)',
      description: 'Use 0 para deixar o card se ajustar ao conteúdo.',
      defaultValue: defaultOptions.cardMinHeight,
      settings: { min: 0, max: 1000, step: 10 },
      category: ['Layout'],
    })

    // ---------- Conteúdo ----------
    .addBooleanSwitch({
      path: 'showExpression',
      name: 'Mostrar expressão (script)',
      defaultValue: defaultOptions.showExpression,
      category: ['Conteúdo'],
    })
    .addBooleanSwitch({
      path: 'showFooter',
      name: 'Mostrar rodapé (última avaliação)',
      defaultValue: defaultOptions.showFooter,
      category: ['Conteúdo'],
    })

    // ---------- Filtros ----------
    .addMultiSelect({
      path: 'stateFilter',
      name: 'Filtrar por estado',
      description: 'Selecione um ou mais estados; deixe vazio para mostrar todos',
      defaultValue: defaultOptions.stateFilter,
      settings: { options: stateOptions, allowCustomValue: false },
      category: ['Filtros'],
    })
    .addTextInput({
      path: 'labelFilter',
      name: 'Filtro por label (regex)',
      description: 'Ex.: severity=critical  ou  team=ecommerce',
      defaultValue: defaultOptions.labelFilter,
      category: ['Filtros'],
    })
    .addTextInput({
      path: 'groupFilter',
      name: 'Filtro por grupo (regex)',
      description: 'Filtra pelo nome do grupo do alert rule',
      defaultValue: defaultOptions.groupFilter,
      category: ['Filtros'],
    })
    .addRadio({
      path: 'sortBy',
      name: 'Ordenar por',
      defaultValue: defaultOptions.sortBy,
      settings: {
        options: [
          { value: 'severity', label: 'Severidade' },
          { value: 'name', label: 'Nome' },
          { value: 'lastEvaluation', label: 'Última avaliação' },
        ],
      },
      category: ['Filtros'],
    })
    .addBooleanSwitch({
      path: 'hideEmptyGroups',
      name: 'Ocultar quando vazio',
      description: 'Não renderiza placeholder caso o filtro não retorne alertas',
      defaultValue: defaultOptions.hideEmptyGroups,
      category: ['Filtros'],
    })

    // ---------- Cores ----------
    .addColorPicker({
      path: 'colorFiring',
      name: 'Cor - Firing',
      defaultValue: defaultOptions.colorFiring,
      category: ['Cores'],
    })
    .addColorPicker({
      path: 'colorPending',
      name: 'Cor - Pending',
      defaultValue: defaultOptions.colorPending,
      category: ['Cores'],
    })
    .addColorPicker({
      path: 'colorNormal',
      name: 'Cor - Normal/Inactive',
      defaultValue: defaultOptions.colorNormal,
      category: ['Cores'],
    })
    .addColorPicker({
      path: 'colorNoData',
      name: 'Cor - No Data',
      defaultValue: defaultOptions.colorNoData,
      category: ['Cores'],
    })
    .addColorPicker({
      path: 'colorError',
      name: 'Cor - Error',
      defaultValue: defaultOptions.colorError,
      category: ['Cores'],
    });
});
