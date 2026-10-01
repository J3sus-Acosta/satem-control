import React, { useRef, useEffect, useState, useCallback } from 'react';
import SignaturePadLib from 'signature_pad';
import { RotateCcw, Check, PenTool } from 'lucide-react';

interface SignaturePadProps {
  onSave: (dataUrl: string) => void;
  onCancel?: () => void;
  title?: string;
  subtitle?: string;
  isSaving?: boolean;
}

export const SignaturePad: React.FC<SignaturePadProps> = ({
  onSave,
  onCancel,
  title = 'Firma Digital Manuscrita',
  subtitle = 'Dibuje su firma utilizando el mouse o pantalla táctil en el recuadro inferior.',
  isSaving = false,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const padRef = useRef<SignaturePadLib | null>(null);
  const [isEmpty, setIsEmpty] = useState(true);

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    // Guardar datos actuales si hay firma
    const prevData = padRef.current && !padRef.current.isEmpty() ? padRef.current.toData() : null;

    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    const rect = container.getBoundingClientRect();
    const width = rect.width > 0 ? rect.width : 300;
    const height = Math.min(Math.max(window.innerHeight * 0.25, 180), 240);

    canvas.width = width * ratio;
    canvas.height = height * ratio;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(ratio, ratio);
    }

    if (padRef.current) {
      padRef.current.clear();
      if (prevData) {
        padRef.current.fromData(prevData);
      }
    }
  }, []);

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const canvas = canvasRef.current;
    const pad = new SignaturePadLib(canvas, {
      penColor: '#0f172a',
      backgroundColor: 'rgba(255, 255, 255, 0.98)',
      minWidth: 1.2,
      maxWidth: 2.8,
    });

    pad.addEventListener('endStroke', () => {
      setIsEmpty(pad.isEmpty());
    });

    padRef.current = pad;
    resizeCanvas();

    const handleResize = () => {
      resizeCanvas();
    };

    window.addEventListener('resize', handleResize);
    
    // Resize observer para detectar cambios de ancho del contenedor
    const ro = new ResizeObserver(() => {
      resizeCanvas();
    });
    ro.observe(containerRef.current);

    return () => {
      window.removeEventListener('resize', handleResize);
      ro.disconnect();
      pad.off();
    };
  }, [resizeCanvas]);

  const handleClear = () => {
    if (padRef.current) {
      padRef.current.clear();
      setIsEmpty(true);
    }
  };

  const handleConfirm = () => {
    if (!padRef.current || padRef.current.isEmpty()) return;
    const dataUrl = padRef.current.toDataURL('image/png');
    onSave(dataUrl);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', width: '100%' }}>
      <div>
        <h4 style={{ margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15.5px', color: 'var(--text-primary)' }}>
          <PenTool size={18} color="var(--accent-primary)" /> {title}
        </h4>
        <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--text-secondary)' }}>{subtitle}</p>
      </div>

      <div
        ref={containerRef}
        style={{
          width: '100%',
          border: '2px dashed var(--border-light)',
          borderRadius: 'var(--radius-md)',
          padding: '6px',
          backgroundColor: 'var(--bg-input)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          boxSizing: 'border-box',
        }}
      >
        <canvas
          ref={canvasRef}
          style={{
            display: 'block',
            width: '100%',
            height: '190px',
            borderRadius: 'var(--radius-sm)',
            cursor: 'crosshair',
            touchAction: 'none',
          }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginTop: '6px', padding: '0 4px', flexWrap: 'wrap', gap: '4px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Área de captura de trazo táctil / ratón</span>
          <span style={{ fontSize: '11px', fontWeight: 600, color: isEmpty ? 'var(--warning)' : 'var(--success)' }}>
            {isEmpty ? '⚠️ Pendiente de firma' : '✓ Trazo detectado'}
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', flexWrap: 'wrap', width: '100%' }}>
        <button
          type="button"
          onClick={handleClear}
          disabled={isEmpty || isSaving}
          className="btn btn-secondary"
          style={{ fontSize: '13px', flex: '1 1 120px', minHeight: '38px', display: 'inline-flex', justifyContent: 'center', alignItems: 'center' }}
        >
          <RotateCcw size={15} /> Limpiar Trazo
        </button>

        <div style={{ display: 'flex', gap: '10px', flex: '2 1 200px' }}>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isSaving}
              className="btn btn-secondary"
              style={{ fontSize: '13px', flex: 1, minHeight: '38px', display: 'inline-flex', justifyContent: 'center', alignItems: 'center' }}
            >
              Cancelar
            </button>
          )}
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isEmpty || isSaving}
            className="btn btn-primary"
            style={{ fontSize: '13px', flex: 2, minHeight: '38px', display: 'inline-flex', justifyContent: 'center', alignItems: 'center' }}
          >
            <Check size={16} /> {isSaving ? 'Estampando Firma...' : 'Confirmar y Estampar Firma'}
          </button>
        </div>
      </div>
    </div>
  );
};
