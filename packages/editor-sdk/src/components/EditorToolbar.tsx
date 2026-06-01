import type { ToolbarConfig, ToolbarItem } from '../types.js';
import type { CommandExecutor } from '../core/commands.js';
import type { EditorHistory } from '../core/history.js';

const DEFAULT_ITEMS: ToolbarItem[] = [
  'select', 'pill', 'thread', 'group',
  'undo', 'redo',
  'zoom-in', 'zoom-out', 'fit',
  'delete',
  'dsl-toggle',
];

const icon = (d: string, size = 16) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;

const TOOL_ICONS: Record<ToolbarItem, string> = {
  'select': icon('<path d="m4 4 7.07 17 2.51-7.39L21 11.07z"/>'),
  'pill': icon('<circle cx="12" cy="12" r="10"/>'),
  'thread': icon('<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>'),
  'group': icon('<rect width="18" height="18" x="3" y="3" rx="2"/>'),
  'undo': icon('<path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/>'),
  'redo': icon('<path d="M21 7v6h-6"/><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7"/>'),
  'zoom-in': icon('<circle cx="11" cy="11" r="8"/><line x1="21" x2="16.65" y1="21" y2="16.65"/><line x1="11" x2="11" y1="8" y2="14"/><line x1="8" x2="14" y1="11" y2="11"/>'),
  'zoom-out': icon('<circle cx="11" cy="11" r="8"/><line x1="21" x2="16.65" y1="21" y2="16.65"/><line x1="8" x2="14" y1="11" y2="11"/>'),
  'fit': icon('<polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" x2="14" y1="3" y2="10"/><line x1="3" x2="10" y1="21" y2="14"/>'),
  'delete': icon('<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>'),
  'duplicate': icon('<rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>'),
  'dsl-toggle': icon('<polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>'),
};

const TOOL_LABELS: Record<ToolbarItem, string> = {
  'select': 'Select',
  'pill': 'Add Pill',
  'thread': 'Add Thread',
  'group': 'Group',
  'undo': 'Undo',
  'redo': 'Redo',
  'zoom-in': 'Zoom In',
  'zoom-out': 'Zoom Out',
  'fit': 'Fit to View',
  'delete': 'Delete',
  'duplicate': 'Duplicate',
  'dsl-toggle': 'Toggle Source',
};

export interface EditorToolbarProps {
  config: ToolbarConfig;
  executor: CommandExecutor;
  history: EditorHistory;
  activeTool?: string;
  onToolChange?: (tool: string) => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onFit?: () => void;
  onDSLToggle?: () => void;
}

export function createToolbarHTML(props: EditorToolbarProps): string {
  const items = props.config.items ?? DEFAULT_ITEMS;
  const buttons = items.map(item => {
    const disabled =
      (item === 'undo' && !props.history.canUndo()) ||
      (item === 'redo' && !props.history.canRedo());
    const active = props.activeTool === item;
    return `<button
      class="tpde-toolbar-btn${active ? ' active' : ''}${disabled ? ' disabled' : ''}"
      data-tool="${item}"
      title="${TOOL_LABELS[item]}"
      ${disabled ? 'disabled' : ''}
    >${TOOL_ICONS[item]}</button>`;
  }).join('');

  return `<div class="tpde-toolbar tpde-toolbar-${props.config.position ?? 'top'}">${buttons}</div>`;
}

export function handleToolbarAction(
  tool: ToolbarItem,
  props: EditorToolbarProps,
): void {
  switch (tool) {
    case 'undo': props.executor.undo(); break;
    case 'redo': props.executor.redo(); break;
    case 'delete': props.executor.deleteSelected(); break;
    case 'zoom-in': props.onZoomIn?.(); break;
    case 'zoom-out': props.onZoomOut?.(); break;
    case 'fit': props.onFit?.(); break;
    case 'dsl-toggle': props.onDSLToggle?.(); break;
    default: props.onToolChange?.(tool); break;
  }
}
