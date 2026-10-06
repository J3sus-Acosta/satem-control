import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { portalApi } from '../../services/portalApi';
import {
  FolderKanban,
  ArrowLeft,
  FileDown,
  Building2,
  FileText,
  Calendar,
  CheckCircle2,
  Clock,
  Wrench,
  User,
  ShieldCheck,
  FileCheck2,
  ExternalLink,
  AlertCircle,
  Paperclip,
} from 'lucide-react';

export const PortalExpedientDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  const [downloadingZip, setDownloadingZip] = useState(false);
  const [activeTab, setActiveTab] = useState<'summary' | 'workOrders' | 'attentions' | 'documents'>('summary');

  const fetchDetail = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await portalApi.get(`/expedients/${id}`);
      setData(res.data.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cargar el detalle del expediente.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchDetail();
  }, [id]);

  const handleDownloadBundle = async () => {
    if (!data?.expedient) return;
    setDownloadingZip(true);
    try {
      const response = await portalApi.get(`/expedients/${data.expedient.id}/bundle`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${data.expedient.code}.zip`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Error al descargar el paquete ZIP.');
    } finally {
      setDownloadingZip(false);
    }
  };

  const handleOpenPdf = async (docInstanceId: string) => {
    try {
      const res = await portalApi.get(`/expedients/documents/${docInstanceId}/pdf`, {
        responseType: 'blob',
      });
      const file = new Blob([res.data], { type: 'application/pdf' });
      const fileURL = URL.createObjectURL(file);
      window.open(fileURL, '_blank');
    } catch (err) {
      alert('Error al abrir el documento PDF.');
    }
  };

  if (loading) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
        Cargando información del expediente...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
        <AlertCircle size={40} color="var(--danger)" style={{ margin: '0 auto 16px auto' }} />
        <h3 style={{ margin: '0 0 8px 0', color: 'var(--text-primary)' }}>Error al acceder al expediente</h3>
        <p style={{ margin: '0 0 20px 0', color: 'var(--text-secondary)' }}>{error}</p>
        <button onClick={() => navigate('/portal/expedients')} className="btn btn-secondary">
          <ArrowLeft size={16} /> Volver a Mis Expedientes
        </button>
      </div>
    );
  }

  const { expedient, documentInstances, attachedDocuments } = data;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header Actions */}
      <div
        className="card"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => navigate('/portal/expedients')}
            className="btn btn-secondary"
            style={{ padding: '8px 12px' }}
          >
            <ArrowLeft size={16} /> Volver
          </button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '18px', fontWeight: 700, color: 'var(--accent-primary)', fontFamily: 'var(--font-heading)' }}>
                {expedient.code}
              </span>
              <span className="badge badge-info">{expedient.status}</span>
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              {expedient.title}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={handleDownloadBundle}
            disabled={downloadingZip}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <FileDown size={16} />
            {downloadingZip ? 'Generando Paquete ZIP...' : 'Descargar Expediente Completo (.ZIP)'}
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', flexWrap: 'wrap' }}>
        <button
          className={`btn ${activeTab === 'summary' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('summary')}
          style={{ fontSize: '13px' }}
        >
          <FolderKanban size={15} /> Resumen General
        </button>
        <button
          className={`btn ${activeTab === 'workOrders' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('workOrders')}
          style={{ fontSize: '13px' }}
        >
          <Clock size={15} /> Órdenes de Trabajo ({expedient.workOrders?.length || 0})
        </button>
        <button
          className={`btn ${activeTab === 'attentions' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('attentions')}
          style={{ fontSize: '13px' }}
        >
          <Wrench size={15} /> Atenciones Técnicas ({expedient.attentions?.length || 0})
        </button>
        <button
          className={`btn ${activeTab === 'documents' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('documents')}
          style={{ fontSize: '13px' }}
        >
          <FileText size={15} /> Documentos & Firmas ({documentInstances?.length || 0})
        </button>
      </div>

      {/* Tab 1: Summary */}
      {activeTab === 'summary' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
          <div className="card">
            <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Building2 size={18} color="var(--accent-primary)" /> Datos de la Empresa y Servicio
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13.5px' }}>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '12px' }}>Empresa Cliente:</span>
                <strong style={{ color: 'var(--text-primary)' }}>{expedient.customer?.legalName}</strong>
                <span style={{ color: 'var(--text-secondary)', marginLeft: '8px' }}>(RUT: {expedient.customer?.taxId})</span>
              </div>

              {expedient.customerEntity && (
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '12px' }}>Entidad / Sucursal:</span>
                  <span style={{ color: 'var(--text-primary)' }}>{expedient.customerEntity.name}</span>
                </div>
              )}

              {expedient.contract && (
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '12px' }}>Contrato SOW Asociado:</span>
                  <span style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>{expedient.contract.code}</span> — {expedient.contract.title}
                </div>
              )}

              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '12px' }}>Fecha de Apertura:</span>
                <span style={{ color: 'var(--text-primary)' }}>{new Date(expedient.createdAt).toLocaleDateString('es-CL')}</span>
              </div>

              {expedient.closedAt && (
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '12px' }}>Fecha de Cierre:</span>
                  <span style={{ color: 'var(--success)' }}>{new Date(expedient.closedAt).toLocaleDateString('es-CL')}</span>
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={18} color="var(--accent-primary)" /> Integridad del Expediente SATEM
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {expedient.integrityItems?.map((item: any) => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--bg-input)',
                    fontSize: '13px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {item.status === 'COMPLETED' ? (
                      <CheckCircle2 size={16} color="var(--success)" />
                    ) : (
                      <Clock size={16} color="var(--warning)" />
                    )}
                    <span style={{ color: 'var(--text-primary)' }}>{item.name}</span>
                  </div>
                  <span className={`badge ${item.status === 'COMPLETED' ? 'badge-success' : 'badge-warning'}`} style={{ fontSize: '11px' }}>
                    {item.status === 'COMPLETED' ? 'Verificado' : 'Pendiente'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Work Orders */}
      {activeTab === 'workOrders' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {expedient.workOrders?.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
              No hay órdenes de trabajo registradas en este expediente.
            </div>
          ) : (
            expedient.workOrders.map((wo: any) => {
              const hasReception = Boolean(wo.receptionConformity);
              const woDocInstanceId = wo.documentInstanceId || (documentInstances || []).find((d: any) => d.id === wo.id || d.documentNumber === wo.code)?.id;
              const rcDocInstanceId = wo.receptionConformity?.documentInstanceId || (documentInstances || []).find((d: any) => d.id === wo.receptionConformity?.id || d.documentNumber === wo.receptionConformity?.code || d.category === 'RECEPTION_CONFORMITY' || d.template?.category === 'RECEPTION_CONFORMITY')?.id;

              return (
                <div key={wo.id} className="card" style={{ border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--accent-primary)' }}>{wo.code}</span>
                      <span className={`badge ${wo.status === 'CONFORMED' ? 'badge-success' : (wo.status === 'AUTHORIZED' || wo.status === 'IN_PROGRESS' ? 'badge-info' : 'badge-warning')}`}>
                        {wo.status}
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {woDocInstanceId && (
                        <button
                          type="button"
                          onClick={() => handleOpenPdf(woDocInstanceId)}
                          className="btn btn-secondary"
                          style={{ fontSize: '12px', padding: '6px 10px', display: 'flex', alignItems: 'center', gap: '4px' }}
                        >
                          <FileText size={14} /> Ver Orden de Trabajo (PDF)
                        </button>
                      )}
                    </div>
                  </div>

                  <h4 style={{ margin: '0 0 6px 0', fontSize: '15px', color: 'var(--text-primary)' }}>{wo.title}</h4>
                  {wo.description && <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>{wo.description}</p>}

                  {hasReception && (
                    <div style={{ marginTop: '12px', padding: '12px 14px', backgroundColor: 'rgba(16, 185, 129, 0.08)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--success)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                      <div style={{ fontSize: '12.5px' }}>
                        <div style={{ color: 'var(--success)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <CheckCircle2 size={15} /> Recepción Conforme Firmada ({wo.receptionConformity.code})
                        </div>
                        <div style={{ color: 'var(--text-secondary)', marginTop: '2px' }}>
                          Aprobada por: <strong>{wo.receptionConformity.acceptedByName}</strong> {wo.receptionConformity.acceptedByRole ? `(${wo.receptionConformity.acceptedByRole})` : ''} el {new Date(wo.receptionConformity.receptionDate).toLocaleDateString('es-CL')}
                        </div>
                        {wo.receptionConformity.comments && (
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px', fontStyle: 'italic' }}>
                            "{wo.receptionConformity.comments}"
                          </div>
                        )}
                      </div>

                      {rcDocInstanceId && (
                        <button
                          type="button"
                          onClick={() => handleOpenPdf(rcDocInstanceId)}
                          className="btn btn-primary"
                          style={{ fontSize: '11.5px', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                        >
                          <FileText size={14} /> Ver Acta Firmada (PDF)
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Tab 3: Attentions */}
      {activeTab === 'attentions' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {expedient.attentions?.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
              No hay reportes de atención técnica en este expediente.
            </div>
          ) : (
            expedient.attentions.map((att: any) => (
              <div key={att.id} className="card" style={{ border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                  <div>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--accent-primary)' }}>{att.code}</span>
                    <span style={{ color: 'var(--text-muted)', margin: '0 8px' }}>•</span>
                    <span style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 600 }}>{att.serviceType?.name}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Calendar size={13} /> {new Date(att.attentionDate).toLocaleDateString('es-CL')}
                    </span>
                    <span className="badge badge-success">{att.hoursWorked} hrs</span>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px', fontSize: '13px' }}>
                  <div style={{ backgroundColor: 'var(--bg-input)', padding: '10px', borderRadius: 'var(--radius-sm)' }}>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '11px', textTransform: 'uppercase', marginBottom: '4px' }}>
                      Problema Reportado
                    </span>
                    <span style={{ color: 'var(--text-secondary)' }}>{att.problem}</span>
                  </div>

                  <div style={{ backgroundColor: 'var(--bg-input)', padding: '10px', borderRadius: 'var(--radius-sm)' }}>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '11px', textTransform: 'uppercase', marginBottom: '4px' }}>
                      Trabajo Realizado
                    </span>
                    <span style={{ color: 'var(--text-secondary)' }}>{att.workDone}</span>
                  </div>
                </div>

                {att.technicians?.length > 0 && (
                  <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-muted)' }}>
                    <User size={13} color="var(--accent-primary)" />
                    <span>Técnicos a cargo: {att.technicians.map((t: any) => t.technician?.fullName).join(', ')}</span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 4: Documents & Signatures */}
      {activeTab === 'documents' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Generated Documents */}
          <div className="card">
            <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileCheck2 size={18} color="var(--accent-primary)" /> Documentos Oficiales Generados
            </h3>

            {documentInstances.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: 0 }}>No hay documentos generados todavía.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {documentInstances.map((doc: any) => (
                  <div
                    key={doc.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px',
                      backgroundColor: 'var(--bg-input)',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-color)',
                      flexWrap: 'wrap',
                      gap: '10px',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 700, color: 'var(--accent-primary)', fontSize: '14px' }}>
                          {doc.documentNumber}
                        </span>
                        <span className={`badge ${doc.status === 'SIGNED' ? 'badge-success' : 'badge-warning'}`} style={{ fontSize: '11px' }}>
                          {doc.status === 'SIGNED' ? '✓ Firmado' : doc.status}
                        </span>
                      </div>
                      <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        {doc.template?.name} • Emitido el {new Date(doc.generatedAt).toLocaleDateString('es-CL')}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      {doc.status !== 'SIGNED' && (
                        <button
                          type="button"
                          onClick={() => navigate(`/portal/signatures?docId=${doc.id}`)}
                          className="btn btn-primary"
                          style={{ padding: '6px 12px', fontSize: '12px' }}
                        >
                          <FileCheck2 size={14} /> Firmar Online
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleOpenPdf(doc.id)}
                        className="btn btn-secondary"
                        style={{ padding: '6px 12px', fontSize: '12px' }}
                      >
                        <ExternalLink size={14} /> Ver PDF
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Attached Files / Evidences */}
          {attachedDocuments.length > 0 && (
            <div className="card">
              <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Paperclip size={18} color="var(--accent-primary)" /> Archivos Adjuntos y Evidencias
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {attachedDocuments.map((att: any) => (
                  <div
                    key={att.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '10px 12px',
                      backgroundColor: 'var(--bg-input)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '13px',
                    }}
                  >
                    <span style={{ color: 'var(--text-primary)' }}>📎 {att.originalName}</span>
                    <span className="badge badge-info">{att.category}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
