import type { SidebarConfig, SidebarTab, PillData, ThreadData } from '../types.js';

export interface EditorSidebarProps {
  config: SidebarConfig;
  activeTab: SidebarTab;
  onTabChange: (tab: SidebarTab) => void;
  selectedPill?: PillData | null;
  selectedThread?: ThreadData | null;
  onPillUpdate?: (pillId: string, changes: Partial<PillData>) => void;
  onThreadUpdate?: (threadId: string, changes: Partial<ThreadData>) => void;
}

const TAB_ICONS: Record<SidebarTab, string> = {
  properties: '⚙',
  chat: '💬',
  comments: '📝',
  ai: '🤖',
  history: '📜',
  plugins: '🔌',
};

const TAB_LABELS: Record<SidebarTab, string> = {
  properties: 'Properties',
  chat: 'Chat',
  comments: 'Comments',
  ai: 'AI',
  history: 'History',
  plugins: 'Plugins',
};

export function createSidebarHTML(props: EditorSidebarProps): string {
  const tabs = props.config.tabs ?? ['properties', 'chat', 'ai', 'history'];
  const width = props.config.width ?? 380;

  const tabButtons = tabs.map(tab =>
    `<button class="tpde-sidebar-tab${props.activeTab === tab ? ' active' : ''}" data-tab="${tab}" title="${TAB_LABELS[tab]}">${TAB_ICONS[tab]}</button>`
  ).join('');

  let panelContent = '';
  if (props.activeTab === 'properties') {
    if (props.selectedPill) {
      const p = props.selectedPill;
      panelContent = `
        <div class="tpde-panel-section">
          <div class="tpde-panel-label">Pill: ${p.id}</div>
          <div class="tpde-panel-field">
            <label>Content</label>
            <textarea class="tpde-panel-input" data-field="content">${p.content}</textarea>
          </div>
          <div class="tpde-panel-field">
            <label>Color</label>
            <input type="color" class="tpde-panel-color" data-field="color" value="${p.color}" />
          </div>
          <div class="tpde-panel-field">
            <label>Position</label>
            <span class="tpde-panel-value">(${p.position.x}, ${p.position.y})</span>
          </div>
        </div>`;
    } else {
      panelContent = '<div class="tpde-panel-empty">Select a pill or thread to view properties</div>';
    }
  } else if (props.activeTab === 'chat') {
    panelContent = '<div class="tpde-panel-empty">Chat — coming soon</div>';
  } else if (props.activeTab === 'ai') {
    panelContent = '<div class="tpde-panel-empty">AI Assistant — coming soon</div>';
  } else if (props.activeTab === 'history') {
    panelContent = '<div class="tpde-panel-empty">Version history — coming soon</div>';
  } else if (props.activeTab === 'comments') {
    panelContent = '<div class="tpde-panel-empty">Comments — coming soon</div>';
  } else {
    panelContent = '<div class="tpde-panel-empty">Plugins — coming soon</div>';
  }

  return `
    <div class="tpde-sidebar" style="width: ${width}px;">
      <div class="tpde-sidebar-tabs">${tabButtons}</div>
      <div class="tpde-sidebar-panel">
        <div class="tpde-panel-header">${TAB_LABELS[props.activeTab]}</div>
        <div class="tpde-panel-body">${panelContent}</div>
      </div>
    </div>`;
}
