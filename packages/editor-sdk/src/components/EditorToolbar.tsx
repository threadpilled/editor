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

const TOOL_ICONS: Record<ToolbarItem, string> = {
  'select': '⊹',
  'pill': '●',
  'thread': '→',
  'group': '▢',
  'undo': '↩',
  'redo': '↪',
  'zoom-in': '+',
  'zoom-out': '−',
  'fit': '⊞',
  'delete': '✕',
  'duplicate': '⧉',
  'dsl-toggle': '</>',
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
