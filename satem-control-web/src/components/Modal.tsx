import React from 'react';
import { X, LucideIcon } from 'lucide-react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  icon?: LucideIcon;
  children: React.ReactNode;
  maxWidth?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  icon: Icon,
  children,
  maxWidth = '580px',
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'var(--bg-overlay, rgba(15, 23, 42, 0.85))',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '16px',
      }}
      data-testid="modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="modal-dialog"
        style={{
          backgroundColor: 'var(--bg-surface, #1e293b)',
          border: '1px solid var(--border-color, #334155)',
          borderRadius: 'var(--radius-lg, 16px)',
          width: '100%',
          maxWidth,
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '24px',
          boxShadow: 'var(--shadow-lg, 0 10px 15px -3px rgba(0, 0, 0, 0.3))',
        }}
        data-testid="modal-dialog"
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px',
          }}
        >
          <h3
            style={{
              fontFamily: 'var(--font-heading, "Outfit", sans-serif)',
              fontSize: '18px',
              fontWeight: 700,
              color: 'var(--text-primary, #f8fafc)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              margin: 0,
            }}
          >
            {Icon && <Icon size={20} color="var(--accent-primary, #00a896)" data-testid="modal-icon" />}
            <span>{title}</span>
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="btn-icon"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted, #64748b)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '4px',
              borderRadius: 'var(--radius-sm, 6px)',
            }}
            aria-label="Cerrar modal"
            data-testid="modal-close-button"
          >
            <X size={18} />
          </button>
        </div>
        <div className="modal-content">{children}</div>
      </div>
    </div>
  );
};
