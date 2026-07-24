export function EditorPage() {
  return (
    <div className="page-stack animate-fade-in" style={{ maxWidth: '100%' }}>
      <div className="page-header">
        <p className="eyebrow">Editor</p>
        <h1 className="page-title">Canvas de Manutenção</h1>
        <p className="page-subtitle">Arraste e conecte componentes para modelar fluxos de manutenção e inspeção.</p>
      </div>

      <div className="editor-layout">
        {/* Editor Toolbar */}
        <div className="editor-toolbar">
          <div className="editor-toolbar-panel animate-fade-in-up stagger-1">
            <h4>Componentes</h4>
            <div className="editor-tool active">
              <i className="fas fa-wrench" /> Ordem de Trabalho
            </div>
            <div className="editor-tool">
              <i className="fas fa-microchip" /> Equipamento
            </div>
            <div className="editor-tool">
              <i className="fas fa-clipboard-check" /> Checklist
            </div>
            <div className="editor-tool">
              <i className="fas fa-chart-line" /> Medição
            </div>
            <div className="editor-tool">
              <i className="fas fa-file-pdf" /> Relatório
            </div>
            <div className="editor-tool">
              <i className="fas fa-bell" /> Notificação
            </div>
          </div>

          <div className="editor-toolbar-panel animate-fade-in-up stagger-2">
            <h4>Conectores</h4>
            <div className="editor-tool">
              <i className="fas fa-arrow-right" /> Sequência
            </div>
            <div className="editor-tool">
              <i className="fas fa-code-branch" /> Condição
            </div>
            <div className="editor-tool">
              <i className="fas fa-sync-alt" /> Loop
            </div>
          </div>

          <div className="editor-toolbar-panel animate-fade-in-up stagger-3">
            <h4>Ações</h4>
            <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
              <i className="fas fa-play" /> Executar Fluxo
            </button>
            <button className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}>
              <i className="fas fa-save" /> Guardar como Preset
            </button>
          </div>
        </div>

        {/* Canvas Area */}
        <div className="editor-canvas">
          <div className="editor-canvas-content">
            {/* Example canvas nodes */}
            <div className="canvas-node" style={{ left: 60, top: 40 }}>
              <i className="fas fa-microchip" style={{ marginRight: 8, color: 'var(--accent-light)' }} />
              <span style={{ fontWeight: 600, fontSize: 13 }}>Bomba Principal</span>
            </div>

            <div className="canvas-node" style={{ left: 280, top: 40 }}>
              <i className="fas fa-clipboard-check" style={{ marginRight: 8, color: 'var(--accent-green)' }} />
              <span style={{ fontWeight: 600, fontSize: 13 }}>Checklist Vibração</span>
            </div>

            <div className="canvas-node" style={{ left: 520, top: 40 }}>
              <i className="fas fa-chart-line" style={{ marginRight: 8, color: 'var(--accent-yellow)' }} />
              <span style={{ fontWeight: 600, fontSize: 13 }}>Medição RMS</span>
            </div>

            <div className="canvas-node selected" style={{ left: 280, top: 160 }}>
              <i className="fas fa-code-branch" style={{ marginRight: 8, color: 'var(--accent)' }} />
              <span style={{ fontWeight: 600, fontSize: 13 }}>Condição: {'>'} 7.1 mm/s</span>
            </div>

            <div className="canvas-node" style={{ left: 60, top: 280 }}>
              <i className="fas fa-check-circle" style={{ marginRight: 8, color: 'var(--accent-green)' }} />
              <span style={{ fontWeight: 600, fontSize: 13 }}>OK — Registar</span>
            </div>

            <div className="canvas-node" style={{ left: 480, top: 280 }}>
              <i className="fas fa-wrench" style={{ marginRight: 8, color: 'var(--accent-red)' }} />
              <span style={{ fontWeight: 600, fontSize: 13 }}>Criar OT Corretiva</span>
            </div>

            {/* SVG Connectors (visual guide) */}
            <svg style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
              <defs>
                <marker id="arrow" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                  <polygon points="0 0, 8 3, 0 6" fill="rgba(99,102,241,0.4)" />
                </marker>
              </defs>
              <line x1="210" y1="64" x2="270" y2="64" stroke="rgba(99,102,241,0.25)" strokeWidth="2" markerEnd="url(#arrow)" />
              <line x1="430" y1="64" x2="510" y2="64" stroke="rgba(99,102,241,0.25)" strokeWidth="2" markerEnd="url(#arrow)" />
              <line x1="370" y1="64" x2="370" y2="150" stroke="rgba(99,102,241,0.25)" strokeWidth="2" markerEnd="url(#arrow)" />
              <line x1="370" y1="210" x2="200" y2="270" stroke="rgba(16,185,129,0.25)" strokeWidth="2" markerEnd="url(#arrow)" />
              <line x1="370" y1="210" x2="540" y2="270" stroke="rgba(239,68,68,0.25)" strokeWidth="2" markerEnd="url(#arrow)" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  )
}
