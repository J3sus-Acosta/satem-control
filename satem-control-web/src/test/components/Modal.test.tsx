import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Modal } from '../../components/Modal.js';
import { FileText } from 'lucide-react';

describe('SATEM Standard Modal Component', () => {
  it('no debe renderizar nada en el DOM si isOpen es false', () => {
    const { container } = render(
      <Modal isOpen={false} onClose={vi.fn()} title="Modal Oculto">
        <p>Contenido invisible</p>
      </Modal>
    );

    expect(container.firstChild).toBeNull();
  });

  it('debe renderizar título, icono y contenido hijo cuando isOpen es true', () => {
    render(
      <Modal isOpen={true} onClose={vi.fn()} title="Nuevo Expediente" icon={FileText}>
        <p>Formulario de prueba</p>
      </Modal>
    );

    expect(screen.getByText('Nuevo Expediente')).toBeInTheDocument();
    expect(screen.getByText('Formulario de prueba')).toBeInTheDocument();
    expect(screen.getByTestId('modal-icon')).toBeInTheDocument();
    expect(screen.getByTestId('modal-dialog')).toBeInTheDocument();
  });

  it('debe invocar la función onClose al hacer clic en el botón de cierre (X)', () => {
    const handleClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={handleClose} title="Modal Cerrable">
        <p>Cuerpo del modal</p>
      </Modal>
    );

    const closeButton = screen.getByTestId('modal-close-button');
    fireEvent.click(closeButton);

    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('debe invocar onClose al hacer clic sobre el overlay de fondo', () => {
    const handleClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={handleClose} title="Modal Overlay">
        <p>Cuerpo del modal</p>
      </Modal>
    );

    const overlay = screen.getByTestId('modal-overlay');
    fireEvent.click(overlay);

    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
