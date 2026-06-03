import type { EditorCommand, PillData, ThreadData } from '../types.js';
import type { EditorStore } from './store.js';
import { EditorHistory } from './history.js';

let idCounter = 0;
function generateId(prefix: string): string {
  return `${prefix}_${++idCounter}_${Date.now().toString(36)}`;
}

export class CommandExecutor {
  private store: EditorStore;
  private history: EditorHistory;

  constructor(store: EditorStore, history: EditorHistory) {
    this.store = store;
    this.history = history;
  }

  execute(command: EditorCommand): void {
    const inverse = this.computeInverse(command);
    if (inverse) this.history.push(command, inverse);
    this.store.dispatch(command);
  }

  undo(): boolean {
    const cmd = this.history.undo();
    if (!cmd) return false;
    this.store.dispatch(cmd);
    return true;
  }

  redo(): boolean {
    const cmd = this.history.redo();
    if (!cmd) return false;
    this.store.dispatch(cmd);
    return true;
  }

  addPill(position: { x: number; y: number }, content = 'New Pill', color = '#60a5fa'): string {
    const id = generateId('pill');
    this.execute({ type: 'addPill', pill: { id, content, position, color } });
    return id;
  }

  addThread(fromPillId: string, toPillId: string, label?: string): string {
    const id = generateId('thread');
    this.execute({ type: 'addThread', thread: { id, fromPillId, toPillId, label } });
    return id;
  }

  removePill(pillId: string): void {
    this.execute({ type: 'removePill', pillId });
  }

  removeThread(threadId: string): void {
    this.execute({ type: 'removeThread', threadId });
  }

  updatePill(pillId: string, changes: Partial<PillData>): void {
    this.execute({ type: 'updatePill', pillId, changes });
  }

  select(ids: string[]): void {
    this.store.dispatch({ type: 'select', ids });
  }

  clearSelection(): void {
    this.store.dispatch({ type: 'clearSelection' });
  }

  moveSelected(dx: number, dy: number): void {
    this.execute({ type: 'moveSelected', dx, dy });
  }

  deleteSelected(): void {
    const { selectedIds, pills, threads } = this.store.getState();
    const pillIds = new Set<string>();
    for (const id of selectedIds) {
      const pill = pills.find(p => p.id === id);
      if (pill) { pillIds.add(id); continue; }
      const thread = threads.find(t => t.id === id);
      if (thread) this.execute({ type: 'removeThread', threadId: id });
    }
    for (const thread of threads) {
      if (pillIds.has(thread.fromPillId) || pillIds.has(thread.toPillId)) {
        this.execute({ type: 'removeThread', threadId: thread.id });
      }
    }
    for (const id of pillIds) {
      this.execute({ type: 'removePill', pillId: id });
    }
  }

  selectAll(): void {
    const { pills } = this.store.getState();
    this.store.dispatch({ type: 'select', ids: pills.map(p => p.id) });
  }

  duplicateSelected(): void {
    const { selectedIds, pills } = this.store.getState();
    for (const id of selectedIds) {
      const pill = pills.find(p => p.id === id);
      if (pill) {
        const newId = generateId('pill');
        this.execute({
          type: 'addPill',
          pill: { ...pill, id: newId, position: { x: pill.position.x + 30, y: pill.position.y + 30 } },
        });
      }
    }
  }

  updateThread(threadId: string, changes: Partial<ThreadData>): void {
    const state = this.store.getState();
    const thread = state.threads.find(t => t.id === threadId);
    if (!thread) return;
    const updated = { ...thread, ...changes };
    this.execute({ type: 'removeThread', threadId });
    this.execute({ type: 'addThread', thread: updated });
  }

  private computeInverse(command: EditorCommand): EditorCommand | null {
    const state = this.store.getState();
    switch (command.type) {
      case 'addPill':
        return { type: 'removePill', pillId: command.pill.id };
      case 'removePill': {
        const pill = state.pills.find(p => p.id === command.pillId);
        return pill ? { type: 'addPill', pill } : null;
      }
      case 'updatePill': {
        const pill = state.pills.find(p => p.id === command.pillId);
        if (!pill) return null;
        const original: Partial<PillData> = {};
        for (const key of Object.keys(command.changes) as (keyof PillData)[]) {
          (original as any)[key] = pill[key];
        }
        return { type: 'updatePill', pillId: command.pillId, changes: original };
      }
      case 'addThread':
        return { type: 'removeThread', threadId: command.thread.id };
      case 'removeThread': {
        const thread = state.threads.find(t => t.id === command.threadId);
        return thread ? { type: 'addThread', thread } : null;
      }
      case 'moveSelected':
        return { type: 'moveSelected', dx: -command.dx, dy: -command.dy };
      default:
        return null;
    }
  }
}
