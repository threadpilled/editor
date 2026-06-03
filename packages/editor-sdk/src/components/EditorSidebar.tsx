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
  properties: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>',
  chat: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
  comments: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>',
  ai: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/></svg>',
  history: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/></svg>',
  plugins: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22v-5"/><path d="M9 8V2"/><path d="M15 8V2"/><path d="M18 8v5a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4V8Z"/></svg>',
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
    `<button class="tpde-sidebar-tab${props.activeTab === tab ? ' active' : ''}" data-tab="${tab}" title="${TAB_LABELS[tab]}" aria-label="${TAB_LABELS[tab]}" role="tab" aria-selected="${props.activeTab === tab}">${TAB_ICONS[tab]}</button>`
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
