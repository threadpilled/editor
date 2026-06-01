import { useRef, useEffect, type CSSProperties, type FC } from 'react';
import type { ThreadPilledEditorProps } from '../types.js';
import { ThreadPilledEditorController } from '../components/ThreadPilledEditor.js';

export interface ThreadPilledEditorReactProps extends ThreadPilledEditorProps {
  className?: string;
  style?: CSSProperties;
}

export const ThreadPilledEditor: FC<ThreadPilledEditorReactProps> = (props) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<ThreadPilledEditorController | null>(null);

  const { className, style, ...editorProps } = props;

  useEffect(() => {
    if (!containerRef.current) return;

    const controller = new ThreadPilledEditorController(editorProps);
    controller.mount(containerRef.current);
    controllerRef.current = controller;

    return () => {
      controller.unmount();
      controllerRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (controllerRef.current && props.source !== undefined) {
      controllerRef.current.setSource(props.source);
    }
  }, [props.source]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ width: '100%', height: '100%', ...style }}
    />
  );
};

export default ThreadPilledEditor;
