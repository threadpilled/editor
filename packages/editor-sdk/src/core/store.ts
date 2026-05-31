import type { DiagramState, PillData, ThreadData, GroupData, EditorCommand } from '../types.js';

export type StoreListener = (state: DiagramState) => void;

export class EditorStore {
  private state: DiagramState;
  private listeners = new Set<StoreListener>();

  constructor(initialSource = '') {
    this.state = {
      pills: [],
      threads: [],
      groups: [],
      selectedIds: new Set(),
      source: initialSource,
    };
    if (initialSource) this.parseSource(initialSource);
  }

  getState(): DiagramState {
    return this.state;
  }

  subscribe(listener: StoreListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    for (const fn of this.listeners) fn(this.state);
  }

  dispatch(command: EditorCommand): void {
    switch (command.type) {
      case 'addPill':
        this.state = { ...this.state, pills: [...this.state.pills, command.pill] };
        break;
      case 'removePill':
        this.state = {
          ...this.state,
          pills: this.state.pills.filter(p => p.id !== command.pillId),
          threads: this.state.threads.filter(t => t.fromPillId !== command.pillId && t.toPillId !== command.pillId),
        };
        break;
      case 'updatePill':
        this.state = {
          ...this.state,
          pills: this.state.pills.map(p => p.id === command.pillId ? { ...p, ...command.changes } : p),
        };
        break;
      case 'addThread':
        this.state = { ...this.state, threads: [...this.state.threads, command.thread] };
        break;
      case 'removeThread':
        this.state = { ...this.state, threads: this.state.threads.filter(t => t.id !== command.threadId) };
        break;
      case 'addGroup':
        this.state = { ...this.state, groups: [...this.state.groups, command.group] };
        break;
      case 'removeGroup':
        this.state = { ...this.state, groups: this.state.groups.filter(g => g.id !== command.groupId) };
        break;
      case 'select':
        this.state = { ...this.state, selectedIds: new Set(command.ids) };
        break;
      case 'clearSelection':
        this.state = { ...this.state, selectedIds: new Set() };
        break;
      case 'moveSelected':
        this.state = {
          ...this.state,
          pills: this.state.pills.map(p =>
            this.state.selectedIds.has(p.id)
              ? { ...p, position: { x: p.position.x + command.dx, y: p.position.y + command.dy } }
              : p
          ),
        };
        break;
    }
    this.state = { ...this.state, source: this.serialize() };
    this.notify();
  }

  setSource(source: string): void {
    this.parseSource(source);
    this.notify();
  }

  private parseSource(source: string): void {
    const pills: PillData[] = [];
    const threads: ThreadData[] = [];
    const pillRegex = /pill\s*\(\s*"([^"]+)"\s*\)\s*\{([^}]*)\}/gi;
    const threadRegex = /thread\s*\(\s*"([^"]+)"\s*\)\s*\{([^}]*)\}/gi;

    let m: RegExpExecArray | null;
    while ((m = pillRegex.exec(source)) !== null) {
      const id = m[1];
      const body = m[2];
      const posMatch = body.match(/position:\s*\(\s*(-?\d+)\s*,\s*(-?\d+)\s*\)/);
      const colorMatch = body.match(/color:\s*"([^"]+)"/);
      const contentMatch = body.match(/content:\s*"""([\s\S]*?)"""/);
      pills.push({
        id,
        position: posMatch ? { x: parseInt(posMatch[1]), y: parseInt(posMatch[2]) } : { x: 100, y: 100 },
        color: colorMatch?.[1] ?? '#60a5fa',
        content: contentMatch?.[1]?.trim() ?? id,
      });
    }

    while ((m = threadRegex.exec(source)) !== null) {
      const id = m[1];
      const body = m[2];
      const fromMatch = body.match(/from:\s*"([^"]+)"/);
      const toMatch = body.match(/to:\s*"([^"]+)"/);
      const labelMatch = body.match(/label:\s*"([^"]+)"/);
      if (fromMatch && toMatch) {
        threads.push({ id, fromPillId: fromMatch[1], toPillId: toMatch[1], label: labelMatch?.[1] });
      }
    }

    this.state = { ...this.state, pills, threads, source };
  }

  private serialize(): string {
    const lines: string[] = ['[METADATA]', 'version: 1', ''];
    if (this.state.pills.length > 0) {
      lines.push('[PILLS]');
      for (const pill of this.state.pills) {
        lines.push(`pill("${pill.id}") {`);
        lines.push(`  position: (${pill.position.x}, ${pill.position.y})`);
        lines.push(`  color: "${pill.color}"`);
        lines.push(`  content: """${pill.content}"""`);
        lines.push('}');
      }
      lines.push('');
    }
    if (this.state.threads.length > 0) {
      lines.push('[THREADS]');
      for (const thread of this.state.threads) {
        lines.push(`thread("${thread.id}") {`);
        lines.push(`  from: "${thread.fromPillId}"`);
        lines.push(`  to: "${thread.toPillId}"`);
        if (thread.label) lines.push(`  label: "${thread.label}"`);
        lines.push('}');
      }
    }
    return lines.join('\n');
  }
}
