import React, { useRef, useEffect, useState } from 'react';
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
  subtitle = 'Dibuje su firma utilizando el mouse o pantalla táctil en el recuadro blanco.',
  isSaving = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const padRef = useRef<SignaturePadLib | null>(null);
  const [isEmpty, setIsEmpty] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Configuración de resolución nítida
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    const rect = canvas.getBoundingClientRect();
    const width = rect.width > 0 ? rect.width : 400;
    const height = 180;

    canvas.width = width * ratio;
    canvas.height = height * ratio;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(ratio, ratio);
    }

    const pad = new SignaturePadLib(canvas, {
      penColor: '#0a2540',
      backgroundColor: '#ffffff',
      minWidth: 1.5,
      maxWidth: 3.2,
    });

    pad.addEventListener('endStroke', () => {
      setIsEmpty(pad.isEmpty());
    });

    padRef.current = pad;

    const handleResize = () => {
      if (!canvas || !padRef.current) return;
      const prevData = !padRef.current.isEmpty() ? padRef.current.toData() : null;
      const newRect = canvas.getBoundingClientRect();
      const newWidth = newRect.width > 0 ? newRect.width : 400;
      
      canvas.width = newWidth * ratio;
      canvas.height = height * ratio;
      
      const newCtx = canvas.getContext('2d');
      if (newCtx) {
        newCtx.scale(ratio, ratio);
      }
      
      padRef.current.clear();
      if (prevData) {
        padRef.current.fromData(prevData);
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', width: '100%', boxSizing: 'border-box' }}>
      <div>
        <h4 style={{ margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15.5px', color: 'var(--text-primary)' }}>
          <PenTool size={18} color="var(--accent-primary)" /> {title}
        </h4>
        <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--text-secondary)' }}>{subtitle}</p>
      </div>

      <div
        style={{
          width: '100%',
          border: '2px dashed var(--border-light)',
          borderRadius: 'var(--radius-md)',
          padding: '8px',
          backgroundColor: '#0f172a',
          boxSizing: 'border-box',
        }}
      >
        <div style={{ width: '100%', height: '180px', backgroundColor: '#ffffff', borderRadius: 'var(--radius-sm)', overflow: 'hidden', position: 'relative' }}>
          <canvas
            ref={canvasRef}
            style={{
              width: '100%',
              height: '180px',
              display: 'block',
              cursor: 'crosshair',
              touchAction: 'none',
              backgroundColor: '#ffffff',
            }}
          />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginTop: '6px', padding: '0 4px', flexWrap: 'wrap', gap: '4px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Área de captura de firma manuscrita</span>
          <span style={{ fontSize: '11px', fontWeight: 600, color: isEmpty ? 'var(--warning)' : 'var(--success)' }}>
            {isEmpty ? '⚠️ Pendiente de trazo' : '✓ Trazo detectado'}
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', flexWrap: 'wrap', width: '100%' }}>
        <button
          type="button"
          onClick={handleClear}
          disabled={isEmpty || isSaving}
          className="btn btn-secondary"
          style={{ fontSize: '13px', flex: '1 1 130px', minHeight: '38px', display: 'inline-flex', justifyContent: 'center', alignItems: 'center', gap: '6px' }}
        >
          <RotateCcw size={15} /> Limpiar Trazo
        </button>

        <div style={{ display: 'flex', gap: '10px', flex: '2 1 220px' }}>
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
            style={{ fontSize: '13px', flex: 2, minHeight: '38px', display: 'inline-flex', justifyContent: 'center', alignItems: 'center', gap: '6px' }}
          >
            <Check size={16} /> {isSaving ? 'Estampando Firma...' : 'Confirmar y Estampar Firma'}
          </button>
        </div>
      </div>
    </div>
  );
};
