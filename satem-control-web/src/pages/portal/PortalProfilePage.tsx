import React, { useState } from 'react';
import { usePortalAuth } from '../../context/PortalAuthContext';
import { portalApi } from '../../services/portalApi';
import { User, Lock, Phone, Mail, Building2, CheckCircle2, AlertCircle, Save } from 'lucide-react';

export const PortalProfilePage: React.FC = () => {
  const { clientUser, refreshProfile } = usePortalAuth();

  const [fullName, setFullName] = useState(clientUser?.fullName || '');
  const [phone, setPhone] = useState(clientUser?.phone || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(null);
    setError(null);

    if (newPassword) {
      if (newPassword !== confirmPassword) {
        setError('La nueva contraseña y su confirmación no coinciden.');
        return;
      }
      if (!currentPassword) {
        setError('Debe ingresar su contraseña actual para establecer una nueva.');
        return;
      }
    }

    setLoading(true);

    try {
      const payload: any = { fullName, phone };
      if (newPassword) {
        payload.currentPassword = currentPassword;
        payload.newPassword = newPassword;
      }

      await portalApi.put('/auth/profile', payload);
      await refreshProfile();

      setSuccess('Perfil actualizado correctamente.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al actualizar el perfil.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div className="card">
        <h2 style={{ margin: '0 0 6px 0', fontSize: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <User size={22} color="var(--accent-primary)" /> Mi Cuenta y Configuración
        </h2>
        <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--text-secondary)' }}>
          Actualice sus datos de contacto y contraseña de acceso al portal.
        </p>
      </div>

      {success && (
        <div
          style={{
            backgroundColor: 'var(--success-bg)',
            color: '#10b981',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            padding: '14px',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <CheckCircle2 size={18} />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div
          style={{
            backgroundColor: 'var(--danger-bg)',
            color: '#f87171',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            padding: '14px',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: 'var(--text-secondary)' }}>
            Empresa Asignada
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              disabled
              value={clientUser?.customerName || ''}
              style={{ width: '100%', paddingLeft: '38px', opacity: 0.7, cursor: 'not-allowed' }}
            />
            <Building2
              size={16}
              color="var(--text-muted)"
              style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
            />
          </div>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: 'var(--text-secondary)' }}>
            Correo Electrónico (Usuario)
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type="email"
              disabled
              value={clientUser?.email || ''}
              style={{ width: '100%', paddingLeft: '38px', opacity: 0.7, cursor: 'not-allowed' }}
            />
            <Mail
              size={16}
              color="var(--text-muted)"
              style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
            />
          </div>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: 'var(--text-secondary)' }}>
            Nombre Completo
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              style={{ width: '100%', paddingLeft: '38px' }}
            />
            <User
              size={16}
              color="var(--text-muted)"
              style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
            />
          </div>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: 'var(--text-secondary)' }}>
            Teléfono de Contacto
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+56 9 1234 5678"
              style={{ width: '100%', paddingLeft: '38px' }}
            />
            <Phone
              size={16}
              color="var(--text-muted)"
              style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
            />
          </div>
        </div>

        <div style={{ margin: '10px 0', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
          <h3 style={{ margin: '0 0 12px 0', fontSize: '15px', color: 'var(--text-primary)' }}>
            Cambiar Contraseña (Opcional)
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                Contraseña Actual
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Ingrese contraseña actual para cambiarla"
                style={{ width: '100%' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                Nueva Contraseña
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                style={{ width: '100%' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                Confirmar Nueva Contraseña
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repita nueva contraseña"
                style={{ width: '100%' }}
              />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px' }}
          >
            <Save size={16} />
            {loading ? 'Guardando Cambios...' : 'Guardar Cambios'}
          </button>
        </div>
      </form>
    </div>
  );
};
