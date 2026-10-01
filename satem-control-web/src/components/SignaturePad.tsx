import React, { useRef, useEffect, useState } from 'react';
import SignaturePadLib from 'signature_pad';
import { RotateCcw, Check, Trash2, PenTool } from 'lucide-react';

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
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const padRef = useRef<SignaturePadLib | null>(null);
  const [isEmpty, setIsEmpty] = useState(true);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    
    // Configurar resolución de canvas nítida
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * ratio;
    canvas.height = rect.height * ratio;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(ratio, ratio);
    }

    const pad = new SignaturePadLib(canvas, {
      penColor: '#0f172a', // Tinta oscura sobre fondo blanco/claro
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      minWidth: 1.2,
      maxWidth: 2.8,
    });

    pad.addEventListener('endStroke', () => {
      setIsEmpty(pad.isEmpty());
    });

    padRef.current = pad;

    return () => {
      pad.off();
    };
  }, []);

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div>
        <h4 style={{ margin: '0 0 6px 0', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px', color: 'var(--text-primary)' }}>
          <PenTool size={18} color="var(--accent-primary)" /> {title}
        </h4>
        <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>{subtitle}</p>
      </div>

      <div
        style={{
          border: '2px dashed var(--border-light)',
          borderRadius: 'var(--radius-md)',
          padding: '8px',
          backgroundColor: 'var(--bg-input)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <canvas
          ref={canvasRef}
          style={{
            width: '100%',
            height: '180px',
            borderRadius: 'var(--radius-sm)',
            cursor: 'crosshair',
            touchAction: 'none',
          }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginTop: '6px', padding: '0 4px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Área de captura de trazo</span>
          <span style={{ fontSize: '11px', color: isEmpty ? 'var(--warning)' : 'var(--success)' }}>
            {isEmpty ? '⚠️ Pendiente de firma' : '✓ Trazo detectado'}
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={handleClear}
          disabled={isEmpty || isSaving}
          className="btn btn-secondary"
          style={{ fontSize: '13px' }}
        >
          <RotateCcw size={15} /> Limpiar Trazo
        </button>

        <div style={{ display: 'flex', gap: '10px' }}>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isSaving}
              className="btn btn-secondary"
              style={{ fontSize: '13px' }}
            >
              Cancelar
            </button>
          )}
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isEmpty || isSaving}
            className="btn btn-primary"
            style={{ fontSize: '13px' }}
          >
            <Check size={16} /> {isSaving ? 'Estampando Firma...' : 'Confirmar y Estampar Firma'}
          </button>
        </div>
      </div>
    </div>
  );
};
