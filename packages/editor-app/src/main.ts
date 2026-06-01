import { ThreadPilledEditorController } from '@threadpilled/editor';
import '../../../packages/editor-sdk/src/styles.css';
import { getStoredTokens, getUser, login, logout, isAuthenticated, type AuthUser } from './auth.js';

const DEMO_TPD = `[METADATA]
version: 1
name: "Demo Diagram"

[PILLS]
pill("start") {
  position: (100, 200)
  color: "#00ff9f"
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

// Handle OAuth callback
if (window.location.pathname === '/callback') {
  const params = new URLSearchParams(window.location.search);
  const code = params.get('code');
  const state = params.get('state');
  if (code && state) {
    import('./auth.js').then(async (auth) => {
      try {
        await auth.handleCallback(code, state);
        window.location.href = '/';
      } catch (e) {
        app.innerHTML = `<div style="padding: 40px; color: var(--tp-fg, #e8e8f0);">Authentication failed: ${(e as Error).message}</div>`;
      }
    });
  }
} else {
  initApp();
}

async function initApp() {
  let currentUser: AuthUser | null = null;
  const tokens = getStoredTokens();
  if (tokens && tokens.expiresAt > Date.now()) {
    currentUser = await getUser(tokens.accessToken);
  }

  const header = document.createElement('header');
  header.style.cssText = 'display: flex; align-items: center; height: 44px; padding: 0 16px; background: var(--tp-surface, #12121a); border-bottom: 1px solid var(--tp-border, #2a2a3a); gap: 12px; flex-shrink: 0;';

  const authHTML = currentUser
    ? `<span style="font-size: 12px; color: var(--tp-fg-secondary, #9a9aad);">${currentUser.name || currentUser.email}</span>
       <button id="signout-btn" style="padding: 4px 12px; border: 1px solid var(--tp-border, #2a2a3a); border-radius: var(--tp-radius-sm, 4px); background: transparent; color: var(--tp-fg, #e8e8f0); cursor: pointer; font-size: 12px;">Sign Out</button>`
    : `<button id="signin-btn" style="padding: 4px 12px; border: 1px solid var(--tp-accent, #00ff9f); border-radius: var(--tp-radius-sm, 4px); background: var(--tp-accent-muted, rgba(0,255,159,0.15)); color: var(--tp-accent, #00ff9f); cursor: pointer; font-size: 12px;">Sign In</button>`;

  header.innerHTML = `
    <span style="font-weight: 700; font-size: 14px; color: var(--tp-fg, #e8e8f0);">ThreadPilled Editor</span>
    <span style="font-size: 12px; color: var(--tp-fg-secondary, #9a9aad);">v0.1.0</span>
    <div style="flex:1"></div>
    <button id="new-btn" style="padding: 4px 12px; border: 1px solid var(--tp-border, #2a2a3a); border-radius: var(--tp-radius-sm, 4px); background: transparent; color: var(--tp-fg, #e8e8f0); cursor: pointer; font-size: 12px;">New Diagram</button>
    ${authHTML}
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
    onSave: (tpd) => {
      console.log('[editor] save triggered, length:', tpd.length);
    },
  });

  editor.mount(editorContainer);

  document.getElementById('new-btn')?.addEventListener('click', () => {
    editor.setSource('[METADATA]\nversion: 1\n\n[PILLS]\npill("new") {\n  position: (200, 200)\n  color: "#00ff9f"\n  content: """New Pill"""\n}\n');
  });

  document.getElementById('signin-btn')?.addEventListener('click', () => login());
  document.getElementById('signout-btn')?.addEventListener('click', () => { logout(); window.location.reload(); });
}
