import type { CanvasConfig, DiagramState, PillData } from '../types.js';

export interface EditorCanvasProps {
  state: DiagramState;
  config: CanvasConfig;
  activeTool: string;
  zoom: number;
  pan: { x: number; y: number };
  onPillClick?: (pillId: string) => void;
  onPillDragEnd?: (pillId: string, x: number, y: number) => void;
  onCanvasClick?: (x: number, y: number) => void;
  onZoomChange?: (zoom: number) => void;
  onPanChange?: (pan: { x: number; y: number }) => void;
}

export function renderCanvasSVG(props: EditorCanvasProps): string {
  const { pills, threads, selectedIds } = props.state;
  const { zoom, pan } = props;
  const grid = props.config.grid !== false;

  let svg = `<svg class="tpde-canvas-svg" viewBox="0 0 2000 1500" preserveAspectRatio="xMidYMid meet"
    style="transform: scale(${zoom}) translate(${pan.x}px, ${pan.y}px);">`;

  if (grid) {
    svg += `<defs>
      <pattern id="tpde-grid" width="${props.config.gridSize ?? 20}" height="${props.config.gridSize ?? 20}" patternUnits="userSpaceOnUse">
        <path d="M ${props.config.gridSize ?? 20} 0 L 0 0 0 ${props.config.gridSize ?? 20}" fill="none" stroke="var(--tpde-grid-color, rgba(128,128,128,0.1))" stroke-width="0.5"/>
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#tpde-grid)" />`;
  }

  for (const thread of threads) {
    const from = pills.find(p => p.id === thread.fromPillId);
    const to = pills.find(p => p.id === thread.toPillId);
    if (!from || !to) continue;
    const selected = selectedIds.has(thread.id);
    svg += `<line
      x1="${from.position.x + 60}" y1="${from.position.y + 20}"
      x2="${to.position.x + 60}" y2="${to.position.y + 20}"
      stroke="${selected ? 'var(--tpde-accent, #60a5fa)' : 'var(--tpd-border, #3f3f46)'}"
      stroke-width="${selected ? 2.5 : 1.5}"
      marker-end="url(#tpde-arrow)"
      data-thread-id="${thread.id}"
      class="tpde-thread${selected ? ' selected' : ''}"
    />`;
    if (thread.label) {
      const mx = (from.position.x + to.position.x) / 2 + 60;
      const my = (from.position.y + to.position.y) / 2 + 15;
      svg += `<text x="${mx}" y="${my}" class="tpde-thread-label" text-anchor="middle">${thread.label}</text>`;
    }
  }

  svg += `<defs><marker id="tpde-arrow" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
    <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--tpd-border, #3f3f46)" />
  </marker></defs>`;

  for (const pill of pills) {
    const selected = selectedIds.has(pill.id);
    const w = pill.width ?? 120;
    const h = pill.height ?? 40;
    svg += `<g data-pill-id="${pill.id}" class="tpde-pill${selected ? ' selected' : ''}" transform="translate(${pill.position.x}, ${pill.position.y})">
      <rect width="${w}" height="${h}" rx="20" ry="20"
        fill="${pill.color}"
        stroke="${selected ? 'var(--tpde-accent, #60a5fa)' : 'transparent'}"
        stroke-width="${selected ? 2 : 0}"
        opacity="0.9"
      />
      <text x="${w / 2}" y="${h / 2 + 5}" text-anchor="middle" fill="white" font-size="13" font-weight="500">${pill.content}</text>
    </g>`;
  }

  svg += '</svg>';
  return svg;
}

export function createCanvasHTML(props: EditorCanvasProps): string {
  const minimap = props.config.minimap ? '<div class="tpde-minimap"></div>' : '';
  return `<div class="tpde-canvas">
    ${renderCanvasSVG(props)}
    ${minimap}
  </div>`;
}
