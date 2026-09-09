import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { ArrowLeft, Save, Eye, CheckCircle2, Code2, Copy } from 'lucide-react';

export const TemplateEditorPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [template, setTemplate] = useState<any>(null);
  const [activeVersion, setActiveVersion] = useState<any>(null);
  const [htmlContent, setHtmlContent] = useState('');
  const [changeReason, setChangeReason] = useState('Actualización de diseño y cláusulas');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (id && id !== 'new') {
      api.get(`/document-templates/${id}`)
        .then((res) => {
          const tpl = res.data.data;
          setTemplate(tpl);
          if (tpl.versions && tpl.versions.length > 0) {
            const v = tpl.versions[0];
            setActiveVersion(v);
            setHtmlContent(v.htmlTemplate);
          }
        })
        .catch((err) => console.error(err))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [id]);

  const handleSaveVersion = async () => {
    if (!id) return;
    setSaving(true);
    try {
      const vRes = await api.post(`/document-templates/${id}/versions`, {
        title: `${template.name} v${template.currentVersion + 1}.0`,
        htmlTemplate: htmlContent,
        changeReason,
      });

      const newV = vRes.data.data;
      await api.post(`/document-templates/${id}/versions/${newV.id}/publish`);
      alert('Nueva versión de plantilla guardada y publicada exitosamente.');
      navigate('/admin/templates');
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Error al guardar versión de plantilla');
    } finally {
      setSaving(false);
    }
  };

  const insertVariable = (varName: string) => {
    setHtmlContent((prev) => `${prev}\n{{${varName}}}`);
  };

  if (loading) return <div style={{ color: 'var(--text-secondary)' }}>Cargando editor de plantilla...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => navigate('/admin/templates')} className="btn btn-secondary" style={{ padding: '8px' }}>
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 style={{ fontSize: '22px', marginBottom: '2px' }}>Editor HTML/CSS — {template?.name || 'Nueva Plantilla'}</h1>
            <span className="badge badge-info">{template?.code} | v{template?.currentVersion || 1}.0</span>
          </div>
        </div>
        <button onClick={handleSaveVersion} className="btn btn-primary" disabled={saving}>
          <Save size={18} /> {saving ? 'Guardando...' : 'Publicar Nueva Versión'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr 1fr', gap: '20px', height: 'calc(100vh - 180px)' }}>
        {/* Panel Izquierdo: Variables Dinámicas */}
        <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '16px', overflowY: 'auto' }}>
          <h3 style={{ fontSize: '14px', marginBottom: '12px', color: 'var(--text-secondary)' }}>Variables Disponibles</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '12px' }}>
            <div>
              <strong style={{ color: 'var(--accent-primary)' }}>EMPRESA SATEM</strong>
              <div onClick={() => insertVariable('empresa.nombre')} style={{ cursor: 'pointer', padding: '4px', backgroundColor: '#0f172a', borderRadius: '4px', marginTop: '4px' }}>
                <code>{"{{empresa.nombre}}"}</code>
              </div>
              <div onClick={() => insertVariable('empresa.rut')} style={{ cursor: 'pointer', padding: '4px', backgroundColor: '#0f172a', borderRadius: '4px', marginTop: '4px' }}>
                <code>{"{{empresa.rut}}"}</code>
              </div>
              <div onClick={() => insertVariable('empresa.email')} style={{ cursor: 'pointer', padding: '4px', backgroundColor: '#0f172a', borderRadius: '4px', marginTop: '4px' }}>
                <code>{"{{empresa.email}}"}</code>
              </div>
            </div>

            <div>
              <strong style={{ color: 'var(--success)' }}>CLIENTE</strong>
              <div onClick={() => insertVariable('cliente.nombreLegal')} style={{ cursor: 'pointer', padding: '4px', backgroundColor: '#0f172a', borderRadius: '4px', marginTop: '4px' }}>
                <code>{"{{cliente.nombreLegal}}"}</code>
              </div>
              <div onClick={() => insertVariable('cliente.taxId')} style={{ cursor: 'pointer', padding: '4px', backgroundColor: '#0f172a', borderRadius: '4px', marginTop: '4px' }}>
                <code>{"{{cliente.taxId}}"}</code>
              </div>
              <div onClick={() => insertVariable('cliente.pais')} style={{ cursor: 'pointer', padding: '4px', backgroundColor: '#0f172a', borderRadius: '4px', marginTop: '4px' }}>
                <code>{"{{cliente.pais}}"}</code>
              </div>
            </div>

            <div>
              <strong style={{ color: 'var(--warning)' }}>CONTRATO / SOW</strong>
              <div onClick={() => insertVariable('contrato.codigo')} style={{ cursor: 'pointer', padding: '4px', backgroundColor: '#0f172a', borderRadius: '4px', marginTop: '4px' }}>
                <code>{"{{contrato.codigo}}"}</code>
              </div>
              <div onClick={() => insertVariable('contrato.titulo')} style={{ cursor: 'pointer', padding: '4px', backgroundColor: '#0f172a', borderRadius: '4px', marginTop: '4px' }}>
                <code>{"{{contrato.titulo}}"}</code>
              </div>
              <div onClick={() => insertVariable('contrato.horas')} style={{ cursor: 'pointer', padding: '4px', backgroundColor: '#0f172a', borderRadius: '4px', marginTop: '4px' }}>
                <code>{"{{contrato.horas}}"}</code>
              </div>
              <div onClick={() => insertVariable('contrato.valor')} style={{ cursor: 'pointer', padding: '4px', backgroundColor: '#0f172a', borderRadius: '4px', marginTop: '4px' }}>
                <code>{"{{contrato.valor}}"}</code>
              </div>
            </div>
          </div>
        </div>

        {/* Panel Central: Editor HTML */}
        <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '16px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '14px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Code2 size={16} /> Código HTML & CSS
          </h3>
          <textarea
            style={{
              flex: 1,
              width: '100%',
              backgroundColor: '#0f172a',
              color: '#f8fafc',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)',
              padding: '12px',
              fontFamily: 'monospace',
              fontSize: '13px',
              resize: 'none',
              outline: 'none',
            }}
            value={htmlContent}
            onChange={(e) => setHtmlContent(e.target.value)}
          />
        </div>

        {/* Panel Derecho: Vista Previa Renderizada */}
        <div style={{ backgroundColor: '#fff', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '16px', overflowY: 'auto', color: '#000' }}>
          <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b', marginBottom: '8px', textTransform: 'uppercase' }}>
            Vista Previa de Salida PDF (Puppeteer)
          </div>
          <iframe
            title="preview"
            style={{ width: '100%', height: '90%', border: 'none' }}
            srcDoc={htmlContent}
          />
        </div>
      </div>
    </div>
  );
};
