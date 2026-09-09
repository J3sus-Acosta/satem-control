import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { FolderKanban, Plus, CheckCircle, AlertTriangle, Download, FileText, Lock } from 'lucide-react';

export const ExpedientsPage: React.FC = () => {
  const [expedients, setExpedients] = useState<any[]>([]);
  const [selectedExpedient, setSelectedExpedient] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'summary' | 'integrity' | 'exceptions' | 'documents'>('summary');
  const [uploadingDocId, setUploadingDocId] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

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
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [customers, setCustomers] = useState<any[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [taxTreatment, setTaxTreatment] = useState('EXPORT_SERVICE');

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

  useEffect(() => {
    fetchExpedients();
    api.get('/customers').then((res) => setCustomers(res.data.data));
  }, []);

  const handleCreateExpedient = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/expedients', {
        customerId: selectedCustomer,
        title: newTitle,
        taxTreatment,
      });
      setShowCreateModal(false);
      setNewTitle('');
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

  const handleDownloadBundle = (id: string, code: string) => {
    window.open(`/api/v1/expedients/${id}/bundle`, '_blank');
  };

  const handleViewPdf = async (docId: string) => {
    try {
      const response = await api.get(`/document-instances/${docId}/pdf`, { responseType: 'blob' });
      const file = new Blob([response.data], { type: 'application/pdf' });
      const fileURL = URL.createObjectURL(file);
      window.open(fileURL, '_blank');
    } catch (err: any) {
      alert('Error al descargar o abrir el PDF del documento');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', marginBottom: '6px' }}>Gestión de Expedientes (EXP-YYYY-NNNNNN)</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            Unidad central de control operativo, facturación, integridad y snapshots de cierre SATEM.
          </p>
        </div>
        <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
          <Plus size={18} /> Nuevo Expediente
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '24px' }}>
        {/* Selector de Expedientes */}
        <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '16px' }}>
          <h3 style={{ fontSize: '14px', marginBottom: '12px', color: 'var(--text-secondary)' }}>Expedientes Registrados</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {expedients.map((exp) => (
              <div
                key={exp.id}
                onClick={() => fetchExpedientDetail(exp.id)}
                style={{
                  padding: '12px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: selectedExpedient?.id === exp.id ? '#334155' : '#0f172a',
                  border: '1px solid',
                  borderColor: selectedExpedient?.id === exp.id ? 'var(--accent-primary)' : 'var(--border-color)',
                  cursor: 'pointer',
                }}
              >
                <div style={{ fontWeight: 'bold', fontSize: '14px', color: 'var(--accent-primary)' }}>{exp.code}</div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{exp.title}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{exp.customer?.legalName}</div>
                <div style={{ marginTop: '8px', display: 'flex', gap: '6px' }}>
                  <span className="badge badge-info">{exp.status}</span>
                  <span className="badge badge-success">{exp.taxTreatment}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Vista Detalle 360° del Expediente Seleccionado */}
        {selectedExpedient ? (
          <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '24px' }}>
            {/* Header del Expediente */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <h2 style={{ fontSize: '22px' }}>{selectedExpedient.code}</h2>
                  <span className="badge badge-info">{selectedExpedient.status}</span>
                  <span className="badge badge-success">{selectedExpedient.taxTreatment}</span>
                </div>
                <div style={{ fontSize: '16px', fontWeight: 600, marginTop: '4px' }}>{selectedExpedient.title}</div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  Cliente: <strong>{selectedExpedient.customer?.legalName}</strong> ({selectedExpedient.customer?.country?.name}) | RUT/Tax ID: {selectedExpedient.customer?.taxId}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => handleDownloadBundle(selectedExpedient.id, selectedExpedient.code)}
                  className="btn btn-secondary"
                >
                  <Download size={16} /> Descargar ZIP Bundle
                </button>

                {selectedExpedient.status !== 'CLOSED' && selectedExpedient.status !== 'CLOSED_WITH_EXCEPTION' && (
                  <>
                    <button onClick={() => handleCloseExpedient(false)} className="btn btn-primary">
                      <Lock size={16} /> Cierre 100%
                    </button>
                    <button onClick={() => handleCloseExpedient(true)} className="btn btn-secondary" style={{ backgroundColor: 'var(--warning)', color: '#000' }}>
                      <AlertTriangle size={16} /> Cierre con Excepción
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Navegación por Tabs */}
            <div className="tabs-nav">
              <button className={`tab-btn ${activeTab === 'summary' ? 'active' : ''}`} onClick={() => setActiveTab('summary')}>
                Resumen Operativo
              </button>
              <button className={`tab-btn ${activeTab === 'integrity' ? 'active' : ''}`} onClick={() => setActiveTab('integrity')}>
                Integridad ({selectedExpedient.integrityItems?.filter((i: any) => i.status === 'COMPLETED').length || 0}/
                {selectedExpedient.integrityItems?.length || 0})
              </button>
              <button className={`tab-btn ${activeTab === 'exceptions' ? 'active' : ''}`} onClick={() => setActiveTab('exceptions')}>
                Excepciones ({selectedExpedient.exceptions?.length || 0})
              </button>
              <button className={`tab-btn ${activeTab === 'documents' ? 'active' : ''}`} onClick={() => setActiveTab('documents')}>
                Documentos ({selectedExpedient.documentInstances?.length || 0})
              </button>
            </div>

            {/* Tab: Resumen Operativo */}
            {activeTab === 'summary' && (
              <div>
                <h3 style={{ fontSize: '16px', marginBottom: '12px' }}>Cadena Operativa & Documental</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
                  <div style={{ padding: '14px', backgroundColor: '#0f172a', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Contrato / SOW</div>
                    <div style={{ fontWeight: 'bold', fontSize: '14px', marginTop: '4px' }}>
                      {selectedExpedient.contract ? selectedExpedient.contract.code : 'Sin contrato específico'}
                    </div>
                  </div>

                  <div style={{ padding: '14px', backgroundColor: '#0f172a', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Órdenes de Trabajo (OT)</div>
                    <div style={{ fontWeight: 'bold', fontSize: '14px', marginTop: '4px' }}>
                      {selectedExpedient.workOrders?.length || 0} registradas
                    </div>
                  </div>

                  <div style={{ padding: '14px', backgroundColor: '#0f172a', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Facturas SII Registradas</div>
                    <div style={{ fontWeight: 'bold', fontSize: '14px', marginTop: '4px' }}>
                      {selectedExpedient.invoices?.length || 0} emitidas
                    </div>
                  </div>
                </div>

                {selectedExpedient.snapshots?.length > 0 && (
                  <div style={{ padding: '16px', backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid var(--success)', borderRadius: 'var(--radius-sm)' }}>
                    <h4 style={{ color: 'var(--success)', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <CheckCircle size={18} /> Instantánea / Snapshot de Cierre Congelado
                    </h4>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                      SHA-256 Checksum: <code>{selectedExpedient.snapshots[0].checksumSha256}</code>
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Tab: Documentos Generados */}
            {activeTab === 'documents' && (
              <div>
                <h3 style={{ fontSize: '16px', marginBottom: '16px' }}>Instancias de Documentos e Historial</h3>
                {selectedExpedient.documentInstances?.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>No hay documentos generados para este expediente.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {selectedExpedient.documentInstances?.map((doc: any) => (
                      <div
                        key={doc.id}
                        style={{
                          padding: '16px',
                          backgroundColor: '#0f172a',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--border-color)',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontWeight: 'bold', fontSize: '14px', color: 'var(--accent-primary)' }}>{doc.code}</span>
                            <span className={`badge ${doc.status === 'SIGNED' ? 'badge-success' : 'badge-info'}`}>
                              {doc.status}
                            </span>
                            <span className="badge badge-secondary">v{doc.templateVersion?.version}</span>
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                            Plantilla: {doc.templateVersion?.template?.name} | Idioma: {doc.language}
                          </div>
                          {doc.pdfSha256 && (
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                              SHA-256: <code>{doc.pdfSha256}</code>
                            </div>
                          )}
                        </div>

                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => handleViewPdf(doc.id)}
                            className="btn btn-secondary"
                            style={{ fontSize: '12px' }}
                          >
                            <FileText size={14} /> Ver PDF
                          </button>
                          {doc.status !== 'SIGNED' && (
                            <button
                              onClick={() => setUploadingDocId(doc.id)}
                              className="btn btn-primary"
                              style={{ fontSize: '12px' }}
                            >
                              Subir PDF Firmado
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Modal Subir PDF Firmado */}
                {uploadingDocId && (
                  <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
                    <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '24px', width: '400px' }}>
                      <h3 style={{ fontSize: '16px', marginBottom: '12px' }}>Subir PDF Firmado</h3>
                      <form onSubmit={handleUploadSignedPdf}>
                        <div className="form-group" style={{ marginBottom: '16px' }}>
                          <label className="form-label">Archivo PDF Firmado</label>
                          <input
                            type="file"
                            accept="application/pdf"
                            className="form-input"
                            onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                            required
                          />
                        </div>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <button type="button" onClick={() => setUploadingDocId(null)} className="btn btn-secondary">
                            Cancelar
                          </button>
                          <button type="submit" className="btn btn-primary" disabled={!selectedFile}>
                            Confirmar Subida
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tab: Integridad del Expediente */}
            {activeTab === 'integrity' && (
              <div>
                <h3 style={{ fontSize: '16px', marginBottom: '16px' }}>Checklist de Integridad Operativa</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {selectedExpedient.integrityItems?.map((item: any) => (
                    <div
                      key={item.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '12px 16px',
                        backgroundColor: '#0f172a',
                        borderRadius: 'var(--radius-sm)',
                        borderLeft: '4px solid',
                        borderColor: item.status === 'COMPLETED' ? 'var(--success)' : 'var(--warning)',
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{item.name}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Categoría: {item.category}</div>
                      </div>
                      <div>
                        {item.status === 'COMPLETED' ? (
                          <span className="badge badge-success">✓ COMPLETO</span>
                        ) : (
                          <span className="badge badge-warning">⚠ PENDIENTE</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '40px' }}>
            Seleccione un expediente para visualizar el detalle 360°.
          </div>
        )}
      </div>

      {/* Modal Nuevo Expediente */}
      {showCreateModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '28px', width: '480px' }}>
            <h3 style={{ fontSize: '18px', marginBottom: '16px' }}>Crear Nuevo Expediente</h3>
            <form onSubmit={handleCreateExpedient}>
              <div className="form-group">
                <label className="form-label">Cliente</label>
                <select
                  className="form-select"
                  value={selectedCustomer}
                  onChange={(e) => setSelectedCustomer(e.target.value)}
                  required
                >
                  <option value="">Seleccione un cliente...</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.legalName} ({c.taxId})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Título del Trabajo / Operación</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ej: Mantenimiento Preventivo Servidores Q3"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '24px' }}>
                <label className="form-label">Tratamiento Tributario Declarado</label>
                <select
                  className="form-select"
                  value={taxTreatment}
                  onChange={(e) => setTaxTreatment(e.target.value)}
                >
                  <option value="EXPORT_SERVICE">Servicio Exportación (Sin IVA)</option>
                  <option value="VAT_APPLIED">Afecto a IVA (19%)</option>
                  <option value="VAT_EXEMPT">Exento de IVA</option>
                  <option value="NO_INVOICE">Operación No Facturable</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn btn-secondary">
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Crear Expediente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
