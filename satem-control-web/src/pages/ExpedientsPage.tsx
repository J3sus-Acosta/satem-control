import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  FolderKanban, Plus, CheckCircle, AlertTriangle, Download,
  FileText, Lock, ShieldAlert, Clock, History, FilePlus, Upload
} from 'lucide-react';

export const ExpedientsPage: React.FC = () => {
  const { user } = useAuth();
  const isViewer = user?.role === 'VIEWER';
  const navigate = useNavigate();

  const [expedients, setExpedients] = useState<any[]>([]);
  const [selectedExpedient, setSelectedExpedient] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'summary' | 'integrity' | 'exceptions' | 'documents' | 'history'>('summary');
  const [uploadingDocId, setUploadingDocId] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Datos auxiliares
  const [customers, setCustomers] = useState<any[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);

  // Form Nuevo Expediente
  const [newTitle, setNewTitle] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [selectedContract, setSelectedContract] = useState(''); // MEJ-05
  const [taxTreatment, setTaxTreatment] = useState('EXPORT_SERVICE');

  // MEJ-02: Modal excepción manual
  const [showExceptionModal, setShowExceptionModal] = useState(false);
  const [excTitle, setExcTitle] = useState('');
  const [excDescription, setExcDescription] = useState('');
  const [excSeverity, setExcSeverity] = useState<'INFO' | 'WARNING' | 'CRITICAL'>('WARNING');

  // MEJ-07: Historial
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // ————————————————————————
  // Fetch expedients
  // ————————————————————————
  const fetchExpedients = () => {
    setLoading(true);
    api.get('/expedients')
      .then((res) => {
        setExpedients(res.data.data);
        if (res.data.data.length > 0 && !selectedExpedient) {
          fetchExpedientDetail(res.data.data[0].id);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  const fetchExpedientDetail = (id: string) => {
    api.get(`/expedients/${id}`)
      .then((res) => setSelectedExpedient(res.data.data))
      .catch((err) => console.error(err));
  };

  // MEJ-05: cargar contratos filtrados por cliente
  const fetchContractsByCustomer = (customerId: string) => {
    if (!customerId) { setContracts([]); return; }
    api.get('/contracts')
      .then((res) => {
        const filtered = (res.data.data as any[]).filter(c => c.customerId === customerId);
        setContracts(filtered);
      })
      .catch(() => setContracts([]));
  };

  // MEJ-07: cargar historial/audit del expediente
  const fetchHistory = (expedientId: string) => {
    setLoadingHistory(true);
    api.get(`/audit-logs?entity=Expedient&entityId=${expedientId}`)
      .then((res) => setAuditLogs(res.data.data || []))
      .catch(() => setAuditLogs([]))
      .finally(() => setLoadingHistory(false));
  };

  useEffect(() => {
    fetchExpedients();
    api.get('/customers').then((res) => setCustomers(res.data.data));
  }, []);

  // Cargar historial cuando cambia el tab
  useEffect(() => {
    if (activeTab === 'history' && selectedExpedient) {
      fetchHistory(selectedExpedient.id);
    }
  }, [activeTab, selectedExpedient?.id]);

  // ————————————————————————
  // Handlers
  // ————————————————————————
  const handleUploadSignedPdf = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadingDocId || !selectedFile) return;
    const formData = new FormData();
    formData.append('signedPdf', selectedFile);
    try {
      await api.post(`/document-instances/${uploadingDocId}/upload-signed`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      alert('Documento firmado subido con éxito');
      setUploadingDocId(null);
      setSelectedFile(null);
      if (selectedExpedient) fetchExpedientDetail(selectedExpedient.id);
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Error al subir el documento firmado');
    }
  };

  const handleCreateExpedient = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/expedients', {
        customerId: selectedCustomer,
        contractId: selectedContract || undefined, // MEJ-05
        title: newTitle,
        taxTreatment,
      });
      setShowCreateModal(false);
      setNewTitle('');
      setSelectedCustomer('');
      setSelectedContract('');
      fetchExpedients();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Error al crear expediente');
    }
  };

  const handleCloseExpedient = async (hasException: boolean) => {
    if (!selectedExpedient) return;
    const reason = prompt('Ingrese la justificación de cierre de la operación:');
    if (!reason) return;
    try {
      await api.post(`/expedients/${selectedExpedient.id}/close`, {
        status: hasException ? 'CLOSED_WITH_EXCEPTION' : 'CLOSED',
        reason,
      });
      fetchExpedientDetail(selectedExpedient.id);
      fetchExpedients();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Error al cerrar expediente');
    }
  };

  const handleDownloadBundle = (id: string) => {
    window.open(`/api/v1/expedients/${id}/bundle`, '_blank');
  };

  const handleViewPdf = async (docId: string) => {
    try {
      const response = await api.get(`/document-instances/${docId}/pdf`, { responseType: 'blob' });
      const file = new Blob([response.data], { type: 'application/pdf' });
      window.open(URL.createObjectURL(file), '_blank');
    } catch {
      alert('Error al descargar o abrir el PDF del documento');
    }
  };

  // MEJ-02: Registrar excepción manual
  const handleCreateException = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExpedient) return;
    try {
      await api.post('/exceptions', {
        expedientId: selectedExpedient.id,
        title: excTitle,
        description: excDescription,
        severity: excSeverity,
      });
      setShowExceptionModal(false);
      setExcTitle('');
      setExcDescription('');
      setExcSeverity('WARNING');
      fetchExpedientDetail(selectedExpedient.id);
    } catch (err: any) {
      const msg = err.response?.data?.error?.message;
      if (err.response?.status === 404) {
        alert('El endpoint POST /exceptions aún no está implementado en la API.');
      } else {
        alert(msg || 'Error al registrar la excepción');
      }
    }
  };

  // ————————————————————————
  // Render helpers
  // ————————————————————————
  const severityBadge = (sev: string) => {
    if (sev === 'CRITICAL') return <span className="badge badge-danger">CRÍTICA</span>;
    if (sev === 'WARNING')  return <span className="badge badge-warning">ADVERTENCIA</span>;
    return <span className="badge badge-info">INFO</span>;
  };

  if (loading) return <div style={{ color: 'var(--text-secondary)' }}>Cargando expedientes...</div>;

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', marginBottom: '6px' }}>Gestión de Expedientes (EXP-YYYY-NNNNNN)</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            Unidad central de control operativo, facturación, integridad y snapshots de cierre SATEM.
          </p>
        </div>
        {!isViewer && (
          <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
            <Plus size={18} /> Nuevo Expediente
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '24px' }}>
        {/* Lista lateral */}
        <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '16px' }}>
          <h3 style={{ fontSize: '13px', marginBottom: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
            Expedientes ({expedients.length})
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {expedients.map((exp) => (
              <div
                key={exp.id}
                onClick={() => { fetchExpedientDetail(exp.id); setActiveTab('summary'); }}
                style={{
                  padding: '12px', borderRadius: 'var(--radius-sm)',
                  backgroundColor: selectedExpedient?.id === exp.id ? '#334155' : '#0f172a',
                  border: '1px solid',
                  borderColor: selectedExpedient?.id === exp.id ? 'var(--accent-primary)' : 'var(--border-color)',
                  cursor: 'pointer', transition: 'all 0.15s',
                }}
              >
                <div style={{ fontWeight: 'bold', fontSize: '13px', color: 'var(--accent-primary)' }}>{exp.code}</div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>{exp.title}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{exp.customer?.legalName}</div>
                <div style={{ marginTop: '8px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  <span className="badge badge-info">{exp.status}</span>
                  <span className="badge badge-success">{exp.taxTreatment}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Detalle 360° */}
        {selectedExpedient ? (
          <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '24px' }}>
            {/* Header expediente */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <h2 style={{ fontSize: '22px' }}>{selectedExpedient.code}</h2>
                  <span className="badge badge-info">{selectedExpedient.status}</span>
                  <span className="badge badge-success">{selectedExpedient.taxTreatment}</span>
                </div>
                <div style={{ fontSize: '16px', fontWeight: 600, marginTop: '4px' }}>{selectedExpedient.title}</div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  Cliente: <strong>{selectedExpedient.customer?.legalName}</strong> ({selectedExpedient.customer?.country?.name}) | Tax ID: {selectedExpedient.customer?.taxId}
                </div>
              </div>

              {!isViewer && (
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  <button onClick={() => handleDownloadBundle(selectedExpedient.id)} className="btn btn-secondary">
                    <Download size={16} /> ZIP Bundle
                  </button>
                  {selectedExpedient.status !== 'CLOSED' && selectedExpedient.status !== 'CLOSED_WITH_EXCEPTION' && (
                    <>
                      <button onClick={() => handleCloseExpedient(false)} className="btn btn-primary">
                        <Lock size={16} /> Cierre 100%
                      </button>
                      <button onClick={() => handleCloseExpedient(true)} className="btn btn-secondary" style={{ backgroundColor: 'var(--warning)', color: '#000' }}>
                        <AlertTriangle size={16} /> Cierre c/Excepción
                      </button>
                    </>
                  )}
                </div>
              )}
              {isViewer && (
                <button onClick={() => handleDownloadBundle(selectedExpedient.id)} className="btn btn-secondary">
                  <Download size={16} /> ZIP Bundle
                </button>
              )}
            </div>

            {/* Tabs */}
            <div className="tabs-nav">
              {[
                { key: 'summary',    label: 'Resumen Operativo' },
                { key: 'integrity',  label: `Integridad (${selectedExpedient.integrityItems?.filter((i: any) => i.status === 'COMPLETED').length || 0}/${selectedExpedient.integrityItems?.length || 0})` },
                { key: 'exceptions', label: `Excepciones (${selectedExpedient.exceptions?.length || 0})` },
                { key: 'documents',  label: `Documentos (${selectedExpedient.documentInstances?.length || 0})` },
                { key: 'history',    label: 'Historial' },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  className={`tab-btn ${activeTab === key ? 'active' : ''}`}
                  onClick={() => setActiveTab(key as any)}
                >
                  {key === 'history' && <History size={13} style={{ marginRight: '4px', verticalAlign: 'middle' }} />}
                  {label}
                </button>
              ))}
            </div>

            {/* TAB: Resumen */}
            {activeTab === 'summary' && (
              <div>
                <h3 style={{ fontSize: '15px', marginBottom: '12px' }}>Cadena Operativa & Documental</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
                  {[
                    { label: 'Contrato / SOW', value: selectedExpedient.contract ? selectedExpedient.contract.code : 'Sin contrato específico' },
                    { label: 'Órdenes de Trabajo (OT)', value: `${selectedExpedient.workOrders?.length || 0} registradas` },
                    { label: 'Facturas SII Registradas', value: `${selectedExpedient.invoices?.length || 0} emitidas` },
                  ].map(({ label, value }) => (
                    <div key={label} style={{ padding: '14px', backgroundColor: '#0f172a', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{label}</div>
                      <div style={{ fontWeight: 'bold', fontSize: '14px', marginTop: '4px' }}>{value}</div>
                    </div>
                  ))}
                </div>
                {selectedExpedient.snapshots?.length > 0 && (
                  <div style={{ padding: '16px', backgroundColor: 'rgba(16,185,129,0.1)', border: '1px solid var(--success)', borderRadius: 'var(--radius-sm)' }}>
                    <h4 style={{ color: 'var(--success)', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <CheckCircle size={18} /> Snapshot de Cierre Congelado
                    </h4>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                      SHA-256: <code>{selectedExpedient.snapshots[0].checksumSha256}</code>
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* TAB: Integridad */}
            {activeTab === 'integrity' && (
              <div>
                <h3 style={{ fontSize: '15px', marginBottom: '16px' }}>Checklist de Integridad Operativa</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {selectedExpedient.integrityItems?.map((item: any) => (
                    <div
                      key={item.id}
                      style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '12px 16px', backgroundColor: '#0f172a', borderRadius: 'var(--radius-sm)',
                        borderLeft: '4px solid',
                        borderColor: item.status === 'COMPLETED' ? 'var(--success)' : 'var(--warning)',
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{item.name}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Categoría: {item.category}</div>
                      </div>
                      <div>
                        {item.status === 'COMPLETED'
                          ? <span className="badge badge-success">✓ COMPLETO</span>
                          : <span className="badge badge-warning">⚠ PENDIENTE</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB: Excepciones — MEJ-02 */}
            {activeTab === 'exceptions' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '15px' }}>
                    Excepciones del Expediente ({selectedExpedient.exceptions?.length || 0})
                  </h3>
                  {!isViewer && (
                    <button onClick={() => setShowExceptionModal(true)} className="btn btn-secondary" style={{ fontSize: '13px', padding: '6px 12px' }}>
                      <ShieldAlert size={15} /> Registrar Excepción
                    </button>
                  )}
                </div>

                {selectedExpedient.exceptions?.length === 0 ? (
                  <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>
                    <ShieldAlert size={32} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.2 }} />
                    Sin excepciones registradas para este expediente.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {selectedExpedient.exceptions?.map((exc: any) => (
                      <div
                        key={exc.id}
                        style={{
                          padding: '14px 16px', backgroundColor: '#0f172a', borderRadius: 'var(--radius-sm)',
                          borderLeft: '4px solid',
                          borderColor: exc.severity === 'CRITICAL' ? 'var(--danger)' : exc.severity === 'WARNING' ? 'var(--warning)' : 'var(--info)',
                          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                            {severityBadge(exc.severity)}
                            <span style={{ fontWeight: 700, fontSize: '14px' }}>{exc.title}</span>
                          </div>
                          <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{exc.description}</div>
                          {exc.resolutionNote && (
                            <div style={{ fontSize: '12px', color: 'var(--success)', marginTop: '4px' }}>
                              ✓ Resolución: {exc.resolutionNote}
                            </div>
                          )}
                        </div>
                        <div>
                          {exc.status === 'OPEN' && <span className="badge badge-danger">ABIERTA</span>}
                          {exc.status === 'RESOLVED' && <span className="badge badge-success">RESUELTA</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB: Documentos */}
            {activeTab === 'documents' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div>
                    <h3 style={{ fontSize: '15px' }}>Instancias de Documentos e Historial</h3>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      🔒 La subida de documentos firmados es asíncrona y no bloquea el progreso de órdenes de trabajo ni atenciones.
                    </p>
                  </div>
                  {!isViewer && (
                    <button
                      onClick={() => navigate(`/documents/generator?customerId=${selectedExpedient.customerId}&expedientId=${selectedExpedient.id}${selectedExpedient.contractId ? `&contractId=${selectedExpedient.contractId}` : ''}`)}
                      className="btn btn-primary"
                      style={{ fontSize: '13px', padding: '7px 14px' }}
                    >
                      <FilePlus size={15} /> Generar Documento / Acta / OT
                    </button>
                  )}
                </div>

                {selectedExpedient.documentInstances?.length === 0 ? (
                  <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px', backgroundColor: '#0f172a', borderRadius: 'var(--radius-sm)' }}>
                    <FileText size={32} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.3 }} />
                    No hay documentos generados para este expediente todavía.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {selectedExpedient.documentInstances?.map((doc: any) => (
                      <div
                        key={doc.id}
                        style={{
                          padding: '16px', backgroundColor: '#0f172a', borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--border-color)',
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontWeight: 'bold', fontSize: '14px', color: 'var(--accent-primary)' }}>{doc.documentNumber || doc.code}</span>
                            <span className={`badge ${doc.status === 'SIGNED' ? 'badge-success' : 'badge-info'}`}>{doc.status}</span>
                            <span className="badge badge-secondary">{doc.category}</span>
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                            Plantilla: {doc.template?.name || 'Documento Oficial SATEM'}
                          </div>
                          {doc.generatedPdfHash && (
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                              SHA-256: <code>{doc.generatedPdfHash.substring(0, 16)}...</code>
                            </div>
                          )}
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button onClick={() => handleViewPdf(doc.id)} className="btn btn-secondary" style={{ fontSize: '12px' }}>
                            <FileText size={14} /> Ver PDF
                          </button>
                          {!isViewer && doc.status !== 'SIGNED' && (
                            <button onClick={() => setUploadingDocId(doc.id)} className="btn btn-primary" style={{ fontSize: '12px' }}>
                              <Upload size={14} /> Subir PDF Firmado
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Modal subir PDF firmado */}
                {uploadingDocId && (
                  <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
                    <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '24px', width: '400px' }}>
                      <h3 style={{ fontSize: '16px', marginBottom: '12px' }}>Subir PDF Firmado</h3>
                      <form onSubmit={handleUploadSignedPdf}>
                        <div className="form-group" style={{ marginBottom: '16px' }}>
                          <label className="form-label">Archivo PDF Firmado</label>
                          <input type="file" accept="application/pdf" className="form-input" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} required />
                        </div>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <button type="button" onClick={() => setUploadingDocId(null)} className="btn btn-secondary">Cancelar</button>
                          <button type="submit" className="btn btn-primary" disabled={!selectedFile}>Confirmar Subida</button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB: Historial — MEJ-07 */}
            {activeTab === 'history' && (
              <div>
                <h3 style={{ fontSize: '15px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <History size={18} color="var(--accent-primary)" /> Historial de Actividad
                </h3>
                {loadingHistory ? (
                  <div style={{ color: 'var(--text-secondary)', padding: '20px 0' }}>Cargando historial...</div>
                ) : auditLogs.length === 0 ? (
                  <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>
                    <Clock size={32} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.2 }} />
                    Sin registros de auditoría para este expediente.
                    <div style={{ fontSize: '12px', marginTop: '8px' }}>Los eventos se registran cuando se crean, modifican o cierran los expedientes.</div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {auditLogs.map((log: any) => (
                      <div
                        key={log.id}
                        style={{
                          display: 'flex', gap: '16px', alignItems: 'flex-start',
                          padding: '12px 16px', backgroundColor: '#0f172a',
                          borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)',
                        }}
                      >
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--accent-primary)', marginTop: '5px', flexShrink: 0 }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontWeight: 700, fontSize: '13px', color: 'var(--accent-primary)' }}>{log.action}</span>
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                              {new Date(log.createdAt).toLocaleString('es-CL')}
                            </span>
                          </div>
                          {log.user && (
                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                              Por: {log.user.fullName} ({log.user.role})
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '40px' }}>
            Seleccione un expediente para visualizar el detalle 360°.
          </div>
        )}
      </div>

      {/* Modal Nuevo Expediente — MEJ-05: selector de contrato */}
      {showCreateModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '28px', width: '500px' }}>
            <h3 style={{ fontSize: '18px', marginBottom: '16px' }}>Crear Nuevo Expediente</h3>
            <form onSubmit={handleCreateExpedient}>
              <div className="form-group">
                <label className="form-label">Cliente *</label>
                <select
                  className="form-select"
                  value={selectedCustomer}
                  onChange={(e) => { setSelectedCustomer(e.target.value); setSelectedContract(''); fetchContractsByCustomer(e.target.value); }}
                  required
                >
                  <option value="">Seleccione un cliente...</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>{c.legalName} ({c.taxId})</option>
                  ))}
                </select>
              </div>

              {/* MEJ-05: Selector de contrato */}
              {selectedCustomer && (
                <div className="form-group">
                  <label className="form-label">Contrato SOW asociado <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(opcional)</span></label>
                  {contracts.length === 0 ? (
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', padding: '8px 0' }}>
                      Este cliente no tiene contratos SOW registrados.
                    </div>
                  ) : (
                    <select className="form-select" value={selectedContract} onChange={(e) => setSelectedContract(e.target.value)}>
                      <option value="">Sin contrato específico</option>
                      {contracts.map((c) => (
                        <option key={c.id} value={c.id}>{c.code} — {c.title}</option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Título del Trabajo / Operación *</label>
                <input
                  type="text" className="form-input"
                  placeholder="Ej: Mantenimiento Preventivo Servidores Q3"
                  value={newTitle} onChange={(e) => setNewTitle(e.target.value)} required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '24px' }}>
                <label className="form-label">Tratamiento Tributario Declarado *</label>
                <select className="form-select" value={taxTreatment} onChange={(e) => setTaxTreatment(e.target.value)}>
                  <option value="EXPORT_SERVICE">Servicio Exportación (Sin IVA)</option>
                  <option value="VAT_APPLIED">Afecto a IVA (19%)</option>
                  <option value="VAT_EXEMPT">Exento de IVA</option>
                  <option value="NO_INVOICE">Operación No Facturable</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn btn-secondary">Cancelar</button>
                <button type="submit" className="btn btn-primary">Crear Expediente</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Registrar Excepción Manual — MEJ-02 */}
      {showExceptionModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '28px', width: '480px' }}>
            <h3 style={{ fontSize: '18px', marginBottom: '4px' }}>Registrar Excepción Manual</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px' }}>
              Expediente: <strong style={{ color: 'var(--accent-primary)' }}>{selectedExpedient?.code}</strong>
            </p>
            <form onSubmit={handleCreateException}>
              <div className="form-group">
                <label className="form-label">Título de la Excepción *</label>
                <input type="text" className="form-input" value={excTitle} onChange={(e) => setExcTitle(e.target.value)}
                  placeholder="Ej: Cliente no firmó en plazo acordado" required />
              </div>
              <div className="form-group">
                <label className="form-label">Descripción Detallada *</label>
                <textarea className="form-textarea" rows={3} value={excDescription}
                  onChange={(e) => setExcDescription(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Severidad</label>
                <select className="form-select" value={excSeverity} onChange={(e) => setExcSeverity(e.target.value as any)}>
                  <option value="INFO">🔵 INFO — Solo informativo</option>
                  <option value="WARNING">🟡 WARNING — Requiere atención</option>
                  <option value="CRITICAL">🔴 CRITICAL — Acción inmediata</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button type="button" onClick={() => setShowExceptionModal(false)} className="btn btn-secondary">Cancelar</button>
                <button type="submit" className="btn btn-primary">Registrar Excepción</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
