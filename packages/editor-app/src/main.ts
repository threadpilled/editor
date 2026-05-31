import { ThreadPilledEditorController } from '@threadpilled/editor';
import '../../../packages/editor-sdk/src/styles.css';

const DEMO_TPD = `[METADATA]
version: 1
name: "Demo Diagram"

[PILLS]
pill("start") {
  position: (100, 200)
  color: "#3b82f6"
  content: """Start"""
}
pill("process") {
  position: (350, 200)
  color: "#8b5cf6"
  content: """Process"""
}
pill("end") {
  position: (600, 200)
  color: "#10b981"
  content: """End"""
}

[THREADS]
thread("t1") {
  from: "start"
  to: "process"
  label: "begin"
}
thread("t2") {
  from: "process"
  to: "end"
  label: "complete"
}`;

const app = document.getElementById('app')!;

const header = document.createElement('header');
header.style.cssText = 'display: flex; align-items: center; height: 44px; padding: 0 16px; background: #18181b; border-bottom: 1px solid #27272a; gap: 12px; flex-shrink: 0;';
header.innerHTML = `
  <span style="font-weight: 700; font-size: 14px;">ThreadPilled Editor</span>
  <span style="font-size: 12px; color: #71717a;">v0.1.0</span>
  <div style="flex:1"></div>
  <button id="new-btn" style="padding: 4px 12px; border: 1px solid #27272a; border-radius: 4px; background: transparent; color: #f4f4f5; cursor: pointer; font-size: 12px;">New Diagram</button>
`;
app.appendChild(header);

const editorContainer = document.createElement('div');
editorContainer.style.cssText = 'flex: 1; overflow: hidden;';
app.appendChild(editorContainer);

const editor = new ThreadPilledEditorController({
  source: DEMO_TPD,
  toolbar: { visible: true, position: 'top' },
  sidebar: { visible: true, tabs: ['properties', 'ai', 'history'], defaultTab: 'properties', width: 340 },
  canvas: { engine: 'svg', minimap: true, grid: true },
  onDiagramChange: (tpd) => {
    console.log('[editor] diagram changed, pills:', tpd.split('pill(').length - 1);
  },
  onPillSelect: (id) => {
    console.log('[editor] pill selected:', id);
  },
});

editor.mount(editorContainer);

document.getElementById('new-btn')?.addEventListener('click', () => {
  editor.setSource('[METADATA]\nversion: 1\n\n[PILLS]\npill("new") {\n  position: (200, 200)\n  color: "#60a5fa"\n  content: """New Pill"""\n}\n');
});
