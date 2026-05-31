import { onMount, onCleanup, type Component } from 'solid-js';
import type { ThreadPilledEditorProps } from '../types.js';
import { ThreadPilledEditorController } from '../components/ThreadPilledEditor.js';

export const ThreadPilledEditor: Component<ThreadPilledEditorProps> = (props) => {
  let containerRef: HTMLDivElement | undefined;
  let controller: ThreadPilledEditorController | undefined;

  onMount(() => {
    if (!containerRef) return;
    controller = new ThreadPilledEditorController(props);
    controller.mount(containerRef);
  });

  onCleanup(() => {
    controller?.unmount();
  });

  return (
    <div
      ref={containerRef}
      class="threadpilled-editor-root"
      style={{ width: '100%', height: '100%' }}
    />
  );
};

export type { ThreadPilledEditorProps };
