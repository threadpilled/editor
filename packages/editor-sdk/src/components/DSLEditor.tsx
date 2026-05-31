export interface DSLEditorProps {
  source: string;
  onChange: (source: string) => void;
  visible: boolean;
  theme?: 'light' | 'dark';
}

export function createDSLEditorHTML(props: DSLEditorProps): string {
  if (!props.visible) return '';

  return `<div class="tpde-dsl-editor">
    <div class="tpde-dsl-header">
      <span class="tpde-dsl-title">TPD Source</span>
    </div>
    <textarea
      class="tpde-dsl-textarea"
      spellcheck="false"
    >${escapeHtml(props.source)}</textarea>
  </div>`;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
