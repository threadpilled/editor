import type { ThreadPilledEditorProps } from '../types.js';
import { ThreadPilledEditorController } from '../components/ThreadPilledEditor.js';

export class ThreadPilledEditorElement extends HTMLElement {
  private controller: ThreadPilledEditorController | null = null;
  private _source = '';

  static get observedAttributes() {
    return ['source', 'room-id', 'toolbar', 'sidebar', 'read-only'];
  }

  get source() { return this._source; }
  set source(val: string) {
    this._source = val;
    this.controller?.setSource(val);
  }

  connectedCallback() {
    const shadow = this.attachShadow({ mode: 'open' });
    const container = document.createElement('div');
    container.style.width = '100%';
    container.style.height = '100%';

    const style = document.createElement('link');
    style.rel = 'stylesheet';
    style.href = new URL('../styles.css', import.meta.url).href;
    shadow.appendChild(style);
    shadow.appendChild(container);

    const props = this.buildProps();
    this.controller = new ThreadPilledEditorController(props);
    this.controller.mount(container);
  }

  disconnectedCallback() {
    this.controller?.unmount();
    this.controller = null;
  }

  attributeChangedCallback(name: string, _old: string, value: string) {
    if (name === 'source') {
      this._source = value;
      this.controller?.setSource(value);
    }
  }

  private buildProps(): ThreadPilledEditorProps {
    return {
      source: this.getAttribute('source') ?? '',
      roomId: this.getAttribute('room-id') ?? undefined,
      readOnly: this.hasAttribute('read-only'),
      toolbar: { visible: this.getAttribute('toolbar') !== 'false' },
      sidebar: { visible: this.getAttribute('sidebar') === 'true' },
      onDiagramChange: (tpd) => {
        this.dispatchEvent(new CustomEvent('diagram-change', { detail: tpd }));
      },
      onPillSelect: (id) => {
        this.dispatchEvent(new CustomEvent('pill-select', { detail: id }));
      },
    };
  }
}

export function register(tagName = 'threadpilled-editor') {
  if (!customElements.get(tagName)) {
    customElements.define(tagName, ThreadPilledEditorElement);
  }
}
