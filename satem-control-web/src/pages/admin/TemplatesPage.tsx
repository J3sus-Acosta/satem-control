import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { FileCode, Plus, Edit, Copy, Eye, CheckCircle2, Building, Layers } from 'lucide-react';

export const TemplatesPage: React.FC = () => {
  const [templates, setTemplates] = useState<any[]>([]);
  const [company, setCompany] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const navigate = useNavigate();

  // Form Empresa
  const [legalName, setLegalName] = useState('');
  const [taxId, setTaxId] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Santiago');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('https://satemsoluciones.com');
  const [representative, setRepresentative] = useState('');
  const [representativeTitle, setRepresentativeTitle] = useState('Gerente General');

  const fetchData = () => {
    setLoading(true);
    Promise.all([api.get('/document-templates'), api.get('/company')])
      .then(([tplRes, compRes]) => {
        setTemplates(tplRes.data.data);
        if (compRes.data.data) {
          setCompany(compRes.data.data);
          setLegalName(compRes.data.data.legalName || '');
          setTaxId(compRes.data.data.taxId || '');
          setAddress(compRes.data.data.address || '');
          setCity(compRes.data.data.city || 'Santiago');
          setEmail(compRes.data.data.email || 'contacto@satemsoluciones.com');
          setPhone(compRes.data.data.phone || '');
          setWebsite(compRes.data.data.website || 'https://satemsoluciones.com');
          setRepresentative(compRes.data.data.legalRepresentative || '');
          setRepresentativeTitle(compRes.data.data.legalRepresentativeTitle || 'Gerente General');
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpdateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.put('/company', {
        legalName,
        taxId,
        address,
        city,
        country: 'Chile',
        email,
        phone,
        website,
        legalRepresentative: representative,
        legalRepresentativeTitle: representativeTitle,
      });
      setShowCompanyModal(false);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Error al actualizar datos corporativos');
    }
  };

  if (loading) return <div style={{ color: 'var(--text-secondary)' }}>Cargando motor de plantillas...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '24px', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FileCode size={28} color="var(--accent-primary)" /> Document Template Engine (Administración)
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            Gestión de plantillas oficiales de SATEM, versionado inmutable, variables Mustache y editor HTML/CSS.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button onClick={() => setShowCompanyModal(true)} className="btn btn-secondary">
            <Building size={18} /> Identidad Corporativa
          </button>
          <button onClick={() => navigate('/admin/templates/new')} className="btn btn-primary">
            <Plus size={18} /> Nueva Plantilla
          </button>
        </div>
      </div>

      {/* Info Identidad Corporativa */}
      {company && (
        <div style={{ padding: '16px 20px', backgroundColor: '#0f172a', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Empresa Prestadora de Servicios (Chile)</div>
            <div style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--accent-primary)' }}>{company.legalName}</div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
              RUT: <strong>{company.taxId}</strong> | {company.address}, {company.city} | Email: <strong>{company.email}</strong> {company.phone ? `| Tel: ${company.phone}` : ''} | Web: {company.website}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
              Representante Legal: <strong>{company.legalRepresentative}</strong> ({company.legalRepresentativeTitle})
            </div>
          </div>
          <button onClick={() => setShowCompanyModal(true)} className="btn btn-secondary" style={{ fontSize: '12px', padding: '6px 12px' }}>
            <Edit size={14} /> Modificar Identidad
          </button>
        </div>
      )}

      {/* Tabla Plantillas */}
      <div className="table-container">
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <h3 style={{ fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Layers size={20} color="var(--accent-primary)" /> Plantillas Registradas en el Sistema
          </h3>
        </div>

        <table className="custom-table">
          <thead>
            <tr>
              <th>Código</th>
              <th>Nombre de Plantilla</th>
              <th>Categoría</th>
              <th>Idioma</th>
              <th>Versión Publicada</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {templates.map((tpl) => (
              <tr key={tpl.id}>
                <td style={{ fontWeight: 'bold', color: 'var(--accent-primary)' }}>{tpl.code}</td>
                <td style={{ fontWeight: 'bold' }}>{tpl.name}</td>
                <td>
                  <span className="badge badge-info">{tpl.category}</span>
                </td>
                <td>
                  <span className="badge badge-warning">{tpl.language}</span>
                </td>
                <td>
                  <span className="badge badge-success">v{tpl.currentVersion}.0 (Publicada)</span>
                </td>
                <td>
                  <button onClick={() => navigate(`/admin/templates/${tpl.id}/editor`)} className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '12px' }}>
                    <Edit size={14} /> Editar HTML/CSS
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Identidad Corporativa */}
      {showCompanyModal && (
        <div className="modal-overlay">
          <div className="modal-dialog" style={{ maxWidth: '540px' }}>
            <h3 style={{ fontSize: '18px', marginBottom: '8px' }}>Identidad Corporativa SATEM SpA</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Estos datos se reflejan automáticamente en los contratos SOW, cotizaciones y encabezados oficiales.
            </p>
            <form onSubmit={handleUpdateCompany}>
              <div className="form-group">
                <label className="form-label">Razón Social</label>
                <input type="text" className="form-input" value={legalName} onChange={(e) => setLegalName(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">RUT Chile</label>
                <input type="text" className="form-input" value={taxId} onChange={(e) => setTaxId(e.target.value)} required />
              </div>
              <div className="grid-form-2">
                <div className="form-group">
                  <label className="form-label">Dirección Fiscal</label>
                  <input type="text" className="form-input" value={address} onChange={(e) => setAddress(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Ciudad</label>
                  <input type="text" className="form-input" value={city} onChange={(e) => setCity(e.target.value)} required />
                </div>
              </div>
              <div className="grid-form-2">
                <div className="form-group">
                  <label className="form-label">Correo Oficial</label>
                  <input type="email" className="form-input" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Teléfono Oficial de SATEM</label>
                  <input type="text" className="form-input" placeholder="+56 9 1234 5678" value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Sitio Web Oficial</label>
                <input type="text" className="form-input" placeholder="https://satemsoluciones.com" value={website} onChange={(e) => setWebsite(e.target.value)} />
              </div>
              <div className="grid-form-2">
                <div className="form-group">
                  <label className="form-label">Representante Legal</label>
                  <input type="text" className="form-input" value={representative} onChange={(e) => setRepresentative(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Cargo Representante</label>
                  <input type="text" className="form-input" value={representativeTitle} onChange={(e) => setRepresentativeTitle(e.target.value)} required />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px', flexWrap: 'wrap' }}>
                <button type="button" onClick={() => setShowCompanyModal(false)} className="btn btn-secondary">Cancelar</button>
                <button type="submit" className="btn btn-primary">Guardar Datos Corporativos</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
