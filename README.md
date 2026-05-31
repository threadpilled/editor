# ThreadPilled Editor

Embeddable ThreadPilled diagram editor SDK. Depends on `@threadpilled/embed` for canvas rendering, adds editing chrome (toolbar, sidebar, DSL editor, undo/redo, collaboration).

## Packages

- `@threadpilled/editor` — SDK with core state, components, and framework adapters
- `@threadpilled/editor-app` — Standalone editor frontend

## Quick Start

```typescript
import { ThreadPilledEditorController } from '@threadpilled/editor';

const editor = new ThreadPilledEditorController({
  source: tpdSource,
  toolbar: { visible: true },
  sidebar: { visible: true, tabs: ['properties', 'ai'] },
  canvas: { engine: 'svg', grid: true },
  onDiagramChange: (tpd) => save(tpd),
});

editor.mount(document.getElementById('editor'));
```

### SolidJS

```tsx
import { ThreadPilledEditor } from '@threadpilled/editor/solidjs';

<ThreadPilledEditor
  source={tpdSource}
  toolbar={{ visible: true }}
  sidebar={{ visible: true }}
  onDiagramChange={(tpd) => save(tpd)}
/>
```

### Web Component

```html
<script type="module">
  import { register } from '@threadpilled/editor/web-component';
  register();
</script>

<threadpilled-editor source="..." toolbar="true" sidebar="true"></threadpilled-editor>
```

## Development

```bash
cd packages/editor-app
npx vite --port 4830
```
