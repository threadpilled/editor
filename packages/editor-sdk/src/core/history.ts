import type { EditorCommand } from '../types.js';

interface HistoryEntry {
  command: EditorCommand;
  inverse: EditorCommand;
  timestamp: number;
}

export class EditorHistory {
  private undoStack: HistoryEntry[] = [];
  private redoStack: HistoryEntry[] = [];
  private maxSize: number;

  constructor(maxSize = 100) {
    this.maxSize = maxSize;
  }

  push(command: EditorCommand, inverse: EditorCommand): void {
    this.undoStack.push({ command, inverse, timestamp: Date.now() });
    if (this.undoStack.length > this.maxSize) this.undoStack.shift();
    this.redoStack = [];
  }

  undo(): EditorCommand | null {
    const entry = this.undoStack.pop();
    if (!entry) return null;
    this.redoStack.push(entry);
    return entry.inverse;
  }

  redo(): EditorCommand | null {
    const entry = this.redoStack.pop();
    if (!entry) return null;
    this.undoStack.push(entry);
    return entry.command;
  }

  canUndo(): boolean { return this.undoStack.length > 0; }
  canRedo(): boolean { return this.redoStack.length > 0; }

  clear(): void {
    this.undoStack = [];
    this.redoStack = [];
  }
}
