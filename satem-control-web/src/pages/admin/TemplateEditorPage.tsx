import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import {
  ArrowLeft, Save, Eye, CheckCircle2, Code2, Copy, Bold, Italic, Underline,
  AlignLeft, AlignCenter, AlignRight, AlignJustify, List, ListOrdered,
  Heading1, Heading2, Heading3, Sparkles, FileText, Undo, Redo
} from 'lucide-react';

export const TemplateEditorPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [template, setTemplate] = useState<any>(null);
  const [activeVersion, setActiveVersion] = useState<any>(null);
  const [htmlContent, setHtmlContent] = useState('');
  const [changeReason, setChangeReason] = useState('Edición visual de contenidos y cláusulas');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showHtmlCode, setShowHtmlCode] = useState(false);

  const editorRef = useRef<HTMLDivElement>(null);

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

  // Sincronizar contenido visual con el editor cuando se carga la plantilla
  useEffect(() => {
    if (editorRef.current && !showHtmlCode && htmlContent) {
      if (editorRef.current.innerHTML !== htmlContent) {
        editorRef.current.innerHTML = htmlContent;
      }
    }
  }, [htmlContent, showHtmlCode]);

  // Ejecutar comando de formato en contentEditable
  const formatDoc = (cmd: string, val: string | undefined = undefined) => {
    document.execCommand(cmd, false, val);
    if (editorRef.current) {
      setHtmlContent(editorRef.current.innerHTML);
    }
  };

  const handleInput = () => {
    if (editorRef.current) {
      setHtmlContent(editorRef.current.innerHTML);
    }
  };

  const handleSaveVersion = async () => {
    if (!id) return;
    setSaving(true);
    try {
      const vRes = await api.post(`/document-templates/${id}/versions`, {
        title: `${template.name} v${(template.currentVersion || 1) + 1}.0`,
        htmlTemplate: htmlContent,
        changeReason,
      });

      const newV = vRes.data.data;
      await api.post(`/document-templates/${id}/versions/${newV.id}/publish`);
      alert('¡Nueva versión de plantilla guardada y publicada exitosamente!');
      navigate('/admin/templates');
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Error al guardar versión de plantilla');
    } finally {
      setSaving(false);
    }
  };

  const insertVariable = (varName: string) => {
    const varText = `{{${varName}}}`;
    if (!showHtmlCode && editorRef.current) {
      editorRef.current.focus();
      document.execCommand('insertText', false, varText);
      setHtmlContent(editorRef.current.innerHTML);
    } else {
      setHtmlContent((prev) => `${prev} ${varText}`);
    }
  };

  if (loading) return <div style={{ color: 'var(--text-secondary)', padding: '24px' }}>Cargando editor visual de plantillas...</div>;

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      {/* Encabezado Superior */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <button onClick={() => navigate('/admin/templates')} className="btn btn-secondary" style={{ padding: '8px' }}>
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 style={{ fontSize: '20px', marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <FileText size={22} color="var(--accent-primary)" /> Editor Visual WYSIWYG — {template?.name || 'Plantilla'}
            </h1>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
              <span className="badge badge-info">{template?.code}</span>
              <span className="badge badge-secondary">Categoría: {template?.category}</span>
              <span className="badge badge-success">v{template?.currentVersion || 1}.0</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => setShowHtmlCode(!showHtmlCode)}
            className="btn btn-secondary"
            style={{ fontSize: '13px' }}
            title="Alternar entre modo visual y código"
          >
            <Code2 size={16} /> {showHtmlCode ? 'Modo Visual (WYSIWYG)' : 'Ver Código HTML'}
          </button>

          <button onClick={handleSaveVersion} className="btn btn-primary" disabled={saving}>
            <Save size={18} /> {saving ? 'Guardando...' : 'Publicar Nueva Versión'}
          </button>
        </div>
      </div>

      {/* Barra de Herramientas de Formato (Visible en Modo Visual) */}
      {!showHtmlCode && (
        <div style={{
          display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '6px',
          backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)', padding: '8px 14px', marginBottom: '16px'
        }}>
          {/* Estilos Tipográficos */}
          <button onClick={() => formatDoc('bold')} className="btn btn-secondary" style={{ padding: '6px 10px' }} title="Negrita">
            <Bold size={15} />
          </button>
          <button onClick={() => formatDoc('italic')} className="btn btn-secondary" style={{ padding: '6px 10px' }} title="Cursiva">
            <Italic size={15} />
          </button>
          <button onClick={() => formatDoc('underline')} className="btn btn-secondary" style={{ padding: '6px 10px' }} title="Subrayado">
            <Underline size={15} />
          </button>

          <div style={{ width: '1px', height: '22px', backgroundColor: 'var(--border-color)', margin: '0 4px' }} />

          {/* Alineación */}
          <button onClick={() => formatDoc('justifyLeft')} className="btn btn-secondary" style={{ padding: '6px 10px' }} title="Alinear a la Izquierda">
            <AlignLeft size={15} />
          </button>
          <button onClick={() => formatDoc('justifyCenter')} className="btn btn-secondary" style={{ padding: '6px 10px' }} title="Centrar">
            <AlignCenter size={15} />
          </button>
          <button onClick={() => formatDoc('justifyRight')} className="btn btn-secondary" style={{ padding: '6px 10px' }} title="Alinear a la Derecha">
            <AlignRight size={15} />
          </button>
          <button onClick={() => formatDoc('justifyFull')} className="btn btn-secondary" style={{ padding: '6px 10px' }} title="Justificado">
            <AlignJustify size={15} />
          </button>

          <div style={{ width: '1px', height: '22px', backgroundColor: 'var(--border-color)', margin: '0 4px' }} />

          {/* Encabezados y Párrafos */}
          <button onClick={() => formatDoc('formatBlock', '<h1>')} className="btn btn-secondary" style={{ padding: '6px 10px', fontSize: '12px', fontWeight: 700 }} title="Título H1">
            H1
          </button>
          <button onClick={() => formatDoc('formatBlock', '<h2>')} className="btn btn-secondary" style={{ padding: '6px 10px', fontSize: '12px', fontWeight: 700 }} title="Título H2">
            H2
          </button>
          <button onClick={() => formatDoc('formatBlock', '<h3>')} className="btn btn-secondary" style={{ padding: '6px 10px', fontSize: '12px', fontWeight: 700 }} title="Título H3">
            H3
          </button>
          <button onClick={() => formatDoc('formatBlock', '<p>')} className="btn btn-secondary" style={{ padding: '6px 10px', fontSize: '12px' }} title="Párrafo Normal">
            Párrafo
          </button>

          <div style={{ width: '1px', height: '22px', backgroundColor: 'var(--border-color)', margin: '0 4px' }} />

          {/* Listas */}
          <button onClick={() => formatDoc('insertUnorderedList')} className="btn btn-secondary" style={{ padding: '6px 10px' }} title="Lista con Viñetas">
            <List size={15} />
          </button>
          <button onClick={() => formatDoc('insertOrderedList')} className="btn btn-secondary" style={{ padding: '6px 10px' }} title="Lista Numerada">
            <ListOrdered size={15} />
          </button>

          <div style={{ width: '1px', height: '22px', backgroundColor: 'var(--border-color)', margin: '0 4px' }} />

          {/* Deshacer / Rehacer */}
          <button onClick={() => formatDoc('undo')} className="btn btn-secondary" style={{ padding: '6px 10px' }} title="Deshacer">
            <Undo size={15} />
          </button>
          <button onClick={() => formatDoc('redo')} className="btn btn-secondary" style={{ padding: '6px 10px' }} title="Rehacer">
            <Redo size={15} />
          </button>

          <div style={{ marginLeft: 'auto', fontSize: '12px', color: 'var(--text-muted)' }}>
            💡 Haz clic directamente en el texto del documento para escribir o formatear.
          </div>
        </div>
      )}

      {/* Layout Principal: Panel de Variables y Lienzo de Edición */}
      <div className="template-editor-layout">
        {/* Panel Lateral Izquierdo: Variables Asistidas */}
        <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '18px', maxHeight: 'calc(100vh - 220px)', overflowY: 'auto' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Sparkles size={16} color="var(--accent-primary)" /> Variables Disponibles
          </h3>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '14px' }}>
            Haz clic en cualquier variable para insertarla en la posición del cursor:
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '12px' }}>
            <div>
              <strong style={{ color: 'var(--accent-primary)', fontSize: '11px', textTransform: 'uppercase' }}>EMPRESA SATEM</strong>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '6px' }}>
                {[
                  'empresa.nombre', 'empresa.rut', 'empresa.direccion',
                  'empresa.pais', 'empresa.email', 'empresa.website', 'empresa.representanteLegal'
                ].map((v) => (
                  <div
                    key={v}
                    onClick={() => insertVariable(v)}
                    style={{ cursor: 'pointer', padding: '5px 8px', backgroundColor: '#0f172a', borderRadius: '4px', fontSize: '11px', color: '#38bdf8', border: '1px solid #1e293b' }}
                  >
                    <code>{`{{${v}}}`}</code>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <strong style={{ color: 'var(--success)', fontSize: '11px', textTransform: 'uppercase' }}>CLIENTE</strong>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '6px' }}>
                {[
                  'cliente.nombreLegal', 'cliente.taxId', 'cliente.pais', 'cliente.ciudad',
                  'cliente.direccion', 'cliente.email', 'cliente.contacto'
                ].map((v) => (
                  <div
                    key={v}
                    onClick={() => insertVariable(v)}
                    style={{ cursor: 'pointer', padding: '5px 8px', backgroundColor: '#0f172a', borderRadius: '4px', fontSize: '11px', color: '#4ade80', border: '1px solid #1e293b' }}
                  >
                    <code>{`{{${v}}}`}</code>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <strong style={{ color: 'var(--warning)', fontSize: '11px', textTransform: 'uppercase' }}>CONTRATO / SOW</strong>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '6px' }}>
                {[
                  'contrato.codigo', 'contrato.titulo', 'contrato.tipoNombre', 'contrato.modalidadNombre',
                  'contrato.descripcion', 'contrato.valor', 'contrato.moneda', 'contrato.horas',
                  'contrato.tarifaHora', 'contrato.fechaEmision', 'contrato.fechaInicio', 'contrato.fechaTermino',
                  'contrato.metodoPago', 'contrato.clausulaExportacion'
                ].map((v) => (
                  <div
                    key={v}
                    onClick={() => insertVariable(v)}
                    style={{ cursor: 'pointer', padding: '5px 8px', backgroundColor: '#0f172a', borderRadius: '4px', fontSize: '11px', color: '#facc15', border: '1px solid #1e293b' }}
                  >
                    <code>{`{{${v}}}`}</code>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <strong style={{ color: 'var(--danger)', fontSize: '11px', textTransform: 'uppercase' }}>EXPEDIENTE & OPERACIONES</strong>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '6px' }}>
                {['expediente.codigo', 'ot.codigo', 'atencion.codigo'].map((v) => (
                  <div
                    key={v}
                    onClick={() => insertVariable(v)}
                    style={{ cursor: 'pointer', padding: '5px 8px', backgroundColor: '#0f172a', borderRadius: '4px', fontSize: '11px', color: '#f87171', border: '1px solid #1e293b' }}
                  >
                    <code>{`{{${v}}}`}</code>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Panel Central: Lienzo de Edición Visual o Código */}
        <div style={{ backgroundColor: '#fff', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '32px', minHeight: 'calc(100vh - 220px)', color: '#0f172a', overflowY: 'auto' }}>
          {showHtmlCode ? (
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#64748b', marginBottom: '8px' }}>
                MODO CÓDIGO HTML CRUDO:
              </div>
              <textarea
                style={{
                  width: '100%',
                  height: '550px',
                  backgroundColor: '#0f172a',
                  color: '#f8fafc',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '16px',
                  fontFamily: 'monospace',
                  fontSize: '13px',
                  resize: 'vertical',
                }}
                value={htmlContent}
                onChange={(e) => setHtmlContent(e.target.value)}
              />
            </div>
          ) : (
            <div>
              {/* Contenedor Visual Editable del Documento */}
              <div
                ref={editorRef}
                contentEditable={true}
                onInput={handleInput}
                style={{
                  minHeight: '600px',
                  outline: 'none',
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                  lineHeight: '1.5',
                  padding: '10px',
                }}
                suppressContentEditableWarning={true}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
