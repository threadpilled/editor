import type { ThreadPilledEditorProps, SidebarTab, ToolbarItem } from '../types.js';
import { EditorStore } from '../core/store.js';
import { EditorHistory } from '../core/history.js';
import { CommandExecutor } from '../core/commands.js';
import { createToolbarHTML, handleToolbarAction } from './EditorToolbar.js';
import { createSidebarHTML } from './EditorSidebar.js';
import { createCanvasHTML } from './EditorCanvas.js';
import { createDSLEditorHTML } from './DSLEditor.js';

export class ThreadPilledEditorController {
  readonly store: EditorStore;
  readonly history: EditorHistory;
  readonly executor: CommandExecutor;

  private activeTool = 'select';
  private activeTab: SidebarTab = 'properties';
  private zoom = 1;
  private pan = { x: 0, y: 0 };
  private dslVisible = false;
  private container: HTMLElement | null = null;
  private props: ThreadPilledEditorProps;
  private unsubscribe: (() => void) | null = null;

  constructor(props: ThreadPilledEditorProps) {
    this.props = props;
    this.store = new EditorStore(props.source ?? '');
    this.history = new EditorHistory();
    this.executor = new CommandExecutor(this.store, this.history);
    this.activeTab = props.sidebar?.defaultTab ?? 'properties';
  }

  mount(container: HTMLElement): void {
    this.container = container;
    this.render();
    this.bindEvents();
    this.unsubscribe = this.store.subscribe(() => {
      this.render();
      this.props.onDiagramChange?.(this.store.getState().source);
    });
  }

  unmount(): void {
    this.unsubscribe?.();
    if (this.container) this.container.innerHTML = '';
    this.container = null;
  }

  setSource(source: string): void {
    this.store.setSource(source);
  }

  getSource(): string {
    return this.store.getState().source;
  }

  private render(): void {
    if (!this.container) return;

    const state = this.store.getState();
    const showToolbar = this.props.toolbar?.visible !== false;
    const showSidebar = this.props.sidebar?.visible === true;
    const showDSL = this.dslVisible && (this.props.dslEditor?.visible !== false);

    let html = '<div class="tpde-editor">';

    if (showToolbar) {
      html += createToolbarHTML({
        config: this.props.toolbar ?? { visible: true },
        executor: this.executor,
        history: this.history,
        activeTool: this.activeTool,
        onToolChange: (t) => { this.activeTool = t; this.render(); },
        onZoomIn: () => { this.zoom = Math.min(3, this.zoom * 1.2); this.render(); },
        onZoomOut: () => { this.zoom = Math.max(0.1, this.zoom / 1.2); this.render(); },
        onFit: () => { this.zoom = 1; this.pan = { x: 0, y: 0 }; this.render(); },
        onDSLToggle: () => { this.dslVisible = !this.dslVisible; this.render(); },
      });
    }

    html += '<div class="tpde-editor-body">';

    if (showDSL) {
      html += createDSLEditorHTML({
        source: state.source,
        onChange: (s) => this.store.setSource(s),
        visible: true,
      });
    }

    html += createCanvasHTML({
      state,
      config: this.props.canvas ?? {},
      activeTool: this.activeTool,
      zoom: this.zoom,
      pan: this.pan,
    });

    if (showSidebar) {
      const selectedPill = [...state.selectedIds]
        .map(id => state.pills.find(p => p.id === id))
        .find(Boolean) ?? null;

      html += createSidebarHTML({
        config: this.props.sidebar!,
        activeTab: this.activeTab,
        onTabChange: (tab) => { this.activeTab = tab; this.render(); },
        selectedPill,
      });
    }

    html += '</div></div>';
    this.container.innerHTML = html;
    this.applyTheme();
  }

  private applyTheme(): void {
    if (!this.container || !this.props.theme) return;
    for (const [key, value] of Object.entries(this.props.theme)) {
      if (value) this.container.style.setProperty(key, value);
    }
  }

  private bindEvents(): void {
    if (!this.container) return;

    this.container.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;

      const toolBtn = target.closest('[data-tool]') as HTMLElement;
      if (toolBtn) {
        const tool = toolBtn.dataset.tool as ToolbarItem;
        handleToolbarAction(tool, {
          config: this.props.toolbar ?? { visible: true },
          executor: this.executor,
          history: this.history,
          activeTool: this.activeTool,
          onToolChange: (t) => { this.activeTool = t; this.render(); },
          onZoomIn: () => { this.zoom = Math.min(3, this.zoom * 1.2); this.render(); },
          onZoomOut: () => { this.zoom = Math.max(0.1, this.zoom / 1.2); this.render(); },
          onFit: () => { this.zoom = 1; this.pan = { x: 0, y: 0 }; this.render(); },
          onDSLToggle: () => { this.dslVisible = !this.dslVisible; this.render(); },
        });
        return;
      }

      const tabBtn = target.closest('[data-tab]') as HTMLElement;
      if (tabBtn) {
        this.activeTab = tabBtn.dataset.tab as SidebarTab;
        this.render();
        return;
      }

      const pill = target.closest('[data-pill-id]') as SVGElement;
      if (pill) {
        const pillId = pill.dataset.pillId!;
        this.executor.select([pillId]);
        this.props.onPillSelect?.(pillId);
        return;
      }
    });

    this.container.addEventListener('input', (e) => {
      const target = e.target as HTMLTextAreaElement;
      if (target.classList.contains('tpde-dsl-textarea')) {
        this.store.setSource(target.value);
      }
    });

    this.container.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) this.executor.redo();
        else this.executor.undo();
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (!(e.target as HTMLElement).matches('input, textarea')) {
          e.preventDefault();
          this.executor.deleteSelected();
        }
      }
    });
  }
}
