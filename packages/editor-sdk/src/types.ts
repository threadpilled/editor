export interface EditorTheme {
  '--tpde-toolbar-bg'?: string;
  '--tpde-toolbar-border'?: string;
  '--tpde-sidebar-bg'?: string;
  '--tpde-sidebar-border'?: string;
  '--tpde-sidebar-width'?: string;
  '--tpde-panel-header-bg'?: string;
  '--tpde-panel-header-text'?: string;
  [key: string]: string | undefined;
}

export interface ToolbarConfig {
  visible: boolean;
  position?: 'top' | 'bottom';
  items?: ToolbarItem[];
}

export type ToolbarItem =
  | 'select' | 'pill' | 'thread' | 'group'
  | 'undo' | 'redo' | 'zoom-in' | 'zoom-out' | 'fit'
  | 'delete' | 'duplicate' | 'dsl-toggle';

export interface SidebarConfig {
  visible: boolean;
  position?: 'left' | 'right';
  tabs?: SidebarTab[];
  defaultTab?: SidebarTab;
  width?: number;
  collapsible?: boolean;
}

export type SidebarTab = 'properties' | 'chat' | 'comments' | 'ai' | 'history' | 'plugins';

export interface CanvasConfig {
  engine?: 'svg' | 'flow';
  minimap?: boolean;
  grid?: boolean;
  snapToGrid?: boolean;
  gridSize?: number;
}

export interface BrandingConfig {
  logo?: string;
  name?: string;
  poweredBy?: boolean;
}

export interface EditorAuth {
  accessToken: string;
  refreshToken?: string;
}

export interface ThreadPilledEditorProps {
  source?: string;
  roomId?: string;
  auth?: EditorAuth;
  theme?: EditorTheme;
  toolbar?: ToolbarConfig;
  sidebar?: SidebarConfig;
  canvas?: CanvasConfig;
  dslEditor?: { visible: boolean };
  branding?: BrandingConfig;
  readOnly?: boolean;

  onDiagramChange?: (tpd: string) => void;
  onPillSelect?: (pillId: string) => void;
  onSave?: (tpd: string) => void;
  onAuthExpired?: () => void;
}

export interface PillData {
  id: string;
  content: string;
  position: { x: number; y: number };
  color: string;
  width?: number;
  height?: number;
}

export interface ThreadData {
  id: string;
  fromPillId: string;
  toPillId: string;
  label?: string;
  style?: string;
}

export interface GroupData {
  id: string;
  label: string;
  pillIds: string[];
  color?: string;
}

export interface DiagramState {
  pills: PillData[];
  threads: ThreadData[];
  groups: GroupData[];
  selectedIds: Set<string>;
  source: string;
}

export type EditorCommand =
  | { type: 'addPill'; pill: PillData }
  | { type: 'removePill'; pillId: string }
  | { type: 'updatePill'; pillId: string; changes: Partial<PillData> }
  | { type: 'addThread'; thread: ThreadData }
  | { type: 'removeThread'; threadId: string }
  | { type: 'addGroup'; group: GroupData }
  | { type: 'removeGroup'; groupId: string }
  | { type: 'select'; ids: string[] }
  | { type: 'clearSelection' }
  | { type: 'moveSelected'; dx: number; dy: number };
