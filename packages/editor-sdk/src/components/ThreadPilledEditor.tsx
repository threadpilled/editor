import type { ThreadPilledEditorProps, SidebarTab, ToolbarItem } from '../types.js';
import { EditorStore } from '../core/store.js';
import { EditorHistory } from '../core/history.js';
import { CommandExecutor } from '../core/commands.js';
import { createToolbarHTML, handleToolbarAction } from './EditorToolbar.js';
import { createSidebarHTML } from './EditorSidebar.js';
import { createCanvasHTML } from './EditorCanvas.js';
import { createDSLEditorHTML } from './DSLEditor.js';

interface DragState {
  type: 'pill' | 'pan';
  startX: number;
  startY: number;
  pillId?: string;
  startPillX?: number;
  startPillY?: number;
  startPanX?: number;
  startPanY?: number;
}

function findDataAttr(el: Element | null, stopAt: Element | null, attr: string): string | null {
  let current = el;
  while (current && current !== stopAt) {
    const val = current.getAttribute(`data-${attr}`);
    if (val) return val;
    if (current instanceof HTMLElement && current.dataset) {
      const camel = attr.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
      if (current.dataset[camel]) return current.dataset[camel]!;
    }
    current = current.parentElement;
  }
  return null;
}

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

  private dragState: DragState | null = null;
  private threadFromPill: string | null = null;
  private boundMouseMove: ((e: MouseEvent) => void) | null = null;
  private boundMouseUp: ((e: MouseEvent) => void) | null = null;

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
    if (this.boundMouseMove) document.removeEventListener('mousemove', this.boundMouseMove);
    if (this.boundMouseUp) document.removeEventListener('mouseup', this.boundMouseUp);
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
      threadFromPillId: this.threadFromPill ?? undefined,
    });

    if (showSidebar) {
      const selectedPill = [...state.selectedIds]
        .map(id => state.pills.find(p => p.id === id))
        .find(Boolean) ?? null;

      const selectedThread = [...state.selectedIds]
        .map(id => state.threads.find(t => t.id === id))
        .find(Boolean) ?? null;

      html += createSidebarHTML({
        config: this.props.sidebar!,
        activeTab: this.activeTab,
        onTabChange: (tab) => { this.activeTab = tab; this.render(); },
        selectedPill,
        selectedThread,
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

  private canvasToWorld(clientX: number, clientY: number): { x: number; y: number } {
    const canvas = this.container?.querySelector('.tpde-canvas');
    if (!canvas) return { x: clientX, y: clientY };
    const rect = canvas.getBoundingClientRect();
    return {
      x: (clientX - rect.left) / this.zoom - this.pan.x,
      y: (clientY - rect.top) / this.zoom - this.pan.y,
    };
  }

  private getToolbarProps() {
    return {
      config: this.props.toolbar ?? { visible: true },
      executor: this.executor,
      history: this.history,
      activeTool: this.activeTool,
      onToolChange: (t: string) => { this.activeTool = t; this.threadFromPill = null; this.render(); },
      onZoomIn: () => { this.zoom = Math.min(3, this.zoom * 1.2); this.render(); },
      onZoomOut: () => { this.zoom = Math.max(0.1, this.zoom / 1.2); this.render(); },
      onFit: () => { this.zoom = 1; this.pan = { x: 0, y: 0 }; this.render(); },
      onDSLToggle: () => { this.dslVisible = !this.dslVisible; this.render(); },
    };
  }

  private bindEvents(): void {
    if (!this.container) return;

    // Click delegation
    this.container.addEventListener('click', (e) => {
      const target = e.target as Element;

      // Toolbar
      const toolBtn = target.closest('[data-tool]') as HTMLElement;
      if (toolBtn) {
        const tool = toolBtn.dataset.tool as ToolbarItem;
        handleToolbarAction(tool, this.getToolbarProps());
        return;
      }

      // Sidebar tabs
      const tabBtn = target.closest('[data-tab]') as HTMLElement;
      if (tabBtn) {
        this.activeTab = tabBtn.dataset.tab as SidebarTab;
        this.render();
        return;
      }

      // Pill click
      const pillId = findDataAttr(target, this.container, 'pill-id');
      if (pillId) {
        if (this.activeTool === 'thread') {
          if (!this.threadFromPill) {
            this.threadFromPill = pillId;
            this.render();
          } else if (this.threadFromPill !== pillId) {
            this.executor.addThread(this.threadFromPill, pillId);
            this.threadFromPill = null;
          }
        } else {
          this.executor.select([pillId]);
          this.props.onPillSelect?.(pillId);
        }
        return;
      }

      // Thread click
      const threadId = findDataAttr(target, this.container, 'thread-id');
      if (threadId) {
        this.executor.select([threadId]);
        return;
      }

      // Canvas background click
      const canvas = target.closest('.tpde-canvas');
      if (canvas) {
        if (this.activeTool === 'pill') {
          const pos = this.canvasToWorld(e.clientX, e.clientY);
          this.executor.addPill(pos);
        } else if (this.activeTool === 'thread') {
          this.threadFromPill = null;
          this.render();
        } else {
          this.executor.clearSelection();
        }
      }
    });

    // Mousedown for drag
    this.container.addEventListener('mousedown', (e) => {
      if (this.props.readOnly) return;
      const target = e.target as Element;

      const pillId = findDataAttr(target, this.container, 'pill-id');
      if (pillId && this.activeTool === 'select') {
        const pill = this.store.getState().pills.find(p => p.id === pillId);
        if (pill) {
          this.dragState = {
            type: 'pill',
            startX: e.clientX,
            startY: e.clientY,
            pillId,
            startPillX: pill.position.x,
            startPillY: pill.position.y,
          };
          this.executor.select([pillId]);
          e.preventDefault();
        }
        return;
      }

      const canvas = target.closest('.tpde-canvas');
      if (canvas && this.activeTool === 'select' && !pillId) {
        this.dragState = {
          type: 'pan',
          startX: e.clientX,
          startY: e.clientY,
          startPanX: this.pan.x,
          startPanY: this.pan.y,
        };
        e.preventDefault();
      }
    });

    // Document-level mouse tracking
    this.boundMouseMove = (e: MouseEvent) => {
      if (!this.dragState) return;

      if (this.dragState.type === 'pill' && this.dragState.pillId) {
        const dx = (e.clientX - this.dragState.startX) / this.zoom;
        const dy = (e.clientY - this.dragState.startY) / this.zoom;
        const el = this.container?.querySelector(`[data-pill-id="${this.dragState.pillId}"]`) as SVGGElement;
        if (el) {
          el.setAttribute('transform', `translate(${this.dragState.startPillX! + dx}, ${this.dragState.startPillY! + dy})`);
        }
      }

      if (this.dragState.type === 'pan') {
        const dx = (e.clientX - this.dragState.startX) / this.zoom;
        const dy = (e.clientY - this.dragState.startY) / this.zoom;
        this.pan = {
          x: this.dragState.startPanX! + dx,
          y: this.dragState.startPanY! + dy,
        };
        const svg = this.container?.querySelector('.tpde-canvas-svg') as SVGElement;
        if (svg) {
          svg.style.transform = `scale(${this.zoom}) translate(${this.pan.x}px, ${this.pan.y}px)`;
        }
      }
    };

    this.boundMouseUp = (e: MouseEvent) => {
      if (!this.dragState) return;

      if (this.dragState.type === 'pill' && this.dragState.pillId) {
        const dx = (e.clientX - this.dragState.startX) / this.zoom;
        const dy = (e.clientY - this.dragState.startY) / this.zoom;
        if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
          this.executor.updatePill(this.dragState.pillId, {
            position: {
              x: this.dragState.startPillX! + dx,
              y: this.dragState.startPillY! + dy,
            },
          });
        }
      }

      this.dragState = null;
    };

    document.addEventListener('mousemove', this.boundMouseMove);
    document.addEventListener('mouseup', this.boundMouseUp);

    // Zoom with wheel — center on cursor position
    this.container.addEventListener('wheel', (e) => {
      const canvas = (e.target as Element).closest('.tpde-canvas');
      if (!canvas) return;
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const factor = e.deltaY > 0 ? 0.9 : 1.1;
      const newZoom = Math.max(0.1, Math.min(3, this.zoom * factor));
      this.pan.x = mx / newZoom - (mx / this.zoom - this.pan.x);
      this.pan.y = my / newZoom - (my / this.zoom - this.pan.y);
      this.zoom = newZoom;
      this.render();
    }, { passive: false });

    // DSL textarea sync
    this.container.addEventListener('input', (e) => {
      const target = e.target as HTMLTextAreaElement;
      if (target.classList.contains('tpde-dsl-textarea')) {
        this.store.setSource(target.value);
      }
      // Sidebar property editing
      if (target.matches('.tpde-panel-input[data-field="content"]')) {
        const selected = [...this.store.getState().selectedIds][0];
        if (selected) this.executor.updatePill(selected, { content: target.value });
      }
    });

    this.container.addEventListener('change', (e) => {
      const target = e.target as HTMLInputElement;
      if (target.matches('.tpde-panel-color[data-field="color"]')) {
        const selected = [...this.store.getState().selectedIds][0];
        if (selected) this.executor.updatePill(selected, { color: target.value });
      }
    });

    // Keyboard shortcuts
    this.container.addEventListener('keydown', (e) => {
      const isInput = (e.target as HTMLElement).matches('input, textarea');

      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) this.executor.redo();
        else this.executor.undo();
        return;
      }

      if ((e.metaKey || e.ctrlKey) && e.key === 'a' && !isInput) {
        e.preventDefault();
        this.executor.selectAll();
        return;
      }

      if ((e.metaKey || e.ctrlKey) && e.key === 'd' && !isInput) {
        e.preventDefault();
        this.executor.duplicateSelected();
        return;
      }

      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        this.props.onSave?.(this.store.getState().source);
        return;
      }

      if (e.key === 'Escape') {
        this.threadFromPill = null;
        this.executor.clearSelection();
        return;
      }

      if ((e.key === 'Delete' || e.key === 'Backspace') && !isInput) {
        e.preventDefault();
        this.executor.deleteSelected();
        return;
      }

      if (!isInput) {
        const nudge = e.shiftKey ? 1 : 10;
        switch (e.key) {
          case 'ArrowUp': e.preventDefault(); this.executor.moveSelected(0, -nudge); break;
          case 'ArrowDown': e.preventDefault(); this.executor.moveSelected(0, nudge); break;
          case 'ArrowLeft': e.preventDefault(); this.executor.moveSelected(-nudge, 0); break;
          case 'ArrowRight': e.preventDefault(); this.executor.moveSelected(nudge, 0); break;
          case '+': case '=': this.zoom = Math.min(3, this.zoom * 1.2); this.render(); break;
          case '-': this.zoom = Math.max(0.1, this.zoom / 1.2); this.render(); break;
          case '0': this.zoom = 1; this.pan = { x: 0, y: 0 }; this.render(); break;
        }
      }
    });
  }
}
