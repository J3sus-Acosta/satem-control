import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { portalApi } from '../../services/portalApi';
import { SignaturePad } from '../../components/SignaturePad';
import {
  FileCheck2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  FolderKanban,
  Calendar,
} from 'lucide-react';

export const PortalSignDocumentPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const targetDocId = searchParams.get('docId');

  const [documents, setDocuments] = useState<any[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchPending = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await portalApi.get('/signatures/pending');
      const docs = res.data.data || [];
      setDocuments(docs);

      if (targetDocId) {
        const found = docs.find((d: any) => d.id === targetDocId);
        if (found) setSelectedDoc(found);
      } else if (docs.length > 0 && !selectedDoc) {
        setSelectedDoc(docs[0]);
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Error al cargar los documentos pendientes de firma.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const handleSaveSignature = async (signatureDataUrl: string) => {
    if (!selectedDoc) return;
    setSigning(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await portalApi.post(`/signatures/${selectedDoc.id}/sign`, {
        signatureBase64: signatureDataUrl,
      });

      setSuccessMsg(`¡Documento ${selectedDoc.documentNumber} firmado exitosamente!`);
      fetchPending();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Error al procesar la firma del documento.');
    } finally {
      setSigning(false);
    }
  };

  const handleOpenPdf = async (docId: string) => {
    try {
      const res = await portalApi.get(`/expedients/documents/${docId}/pdf`, {
        responseType: 'blob',
      });
      const file = new Blob([res.data], { type: 'application/pdf' });
      const fileURL = URL.createObjectURL(file);
      window.open(fileURL, '_blank');
    } catch (err) {
      alert('Error al abrir el archivo PDF.');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ margin: '0 0 6px 0', fontSize: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FileCheck2 size={22} color="var(--accent-primary)" /> Firma Digital de Documentos
          </h2>
          <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--text-secondary)' }}>
            Revise los documentos pendientes y estampe su firma manuscrita digitalizada con trazabilidad garantizada.
          </p>
        </div>

        <button onClick={fetchPending} className="btn btn-secondary" style={{ fontSize: '13px' }}>
          <RefreshCw size={15} /> Actualizar
        </button>
      </div>

      {/* Success Notification */}
      {successMsg && (
        <div
          style={{
            backgroundColor: 'var(--success-bg)',
            color: '#10b981',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            padding: '16px',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <CheckCircle2 size={20} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Error Notification */}
      {errorMsg && (
        <div
          style={{
            backgroundColor: 'var(--danger-bg)',
            color: '#f87171',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            padding: '16px',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <AlertCircle size={20} />
          <span>{errorMsg}</span>
        </div>
      )}

      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
          Cargando documentos pendientes...
        </div>
      ) : documents.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <CheckCircle2 size={48} color="var(--success)" style={{ margin: '0 auto 16px auto', opacity: 0.8 }} />
          <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', color: 'var(--text-primary)' }}>
            ¡Todo al día!
          </h3>
          <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--text-secondary)' }}>
            No tiene documentos pendientes de firma en este momento.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 340px) 1fr', gap: '20px', alignItems: 'start' }}>
          {/* Document list selector */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <h3 style={{ margin: '0 0 4px 0', fontSize: '15px', color: 'var(--text-secondary)' }}>
              Documentos por Firmar ({documents.length})
            </h3>

            {documents.map((doc) => {
              const isSelected = selectedDoc?.id === doc.id;
              return (
                <div
                  key={doc.id}
                  className="card"
                  onClick={() => setSelectedDoc(doc)}
                  style={{
                    cursor: 'pointer',
                    padding: '14px',
                    border: isSelected ? '2px solid var(--accent-primary)' : '1px solid var(--border-color)',
                    backgroundColor: isSelected ? 'var(--bg-card-hover)' : 'var(--bg-surface)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--accent-primary)' }}>
                      {doc.documentNumber}
                    </span>
                    <span className="badge badge-warning" style={{ fontSize: '10px' }}>Pendiente</span>
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                    {doc.template?.name}
                  </div>
                  {doc.expedient && (
                    <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <FolderKanban size={12} /> {doc.expedient.code}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Signing workspace */}
          {selectedDoc ? (
            <div className="card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
                <div>
                  <h3 style={{ margin: '0 0 6px 0', fontSize: '18px', color: 'var(--text-primary)' }}>
                    {selectedDoc.template?.name}
                  </h3>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                    Código: <strong style={{ color: 'var(--accent-primary)' }}>{selectedDoc.documentNumber}</strong> • Expediente: {selectedDoc.expedient?.code || 'N/A'}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleOpenPdf(selectedDoc.id)}
                  className="btn btn-secondary"
                  style={{ fontSize: '13px' }}
                >
                  <ExternalLink size={15} /> Ver PDF Original
                </button>
              </div>

              {/* Signature Canvas Box */}
              <div style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '20px' }}>
                <SignaturePad
                  onSave={handleSaveSignature}
                  isSaving={signing}
                  title="Estampar Firma de Aceptación"
                  subtitle="Al confirmar, su firma manuscrita será incrustada con fecha, hora e IP en el documento oficial."
                />
              </div>
            </div>
          ) : (
            <div className="card" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              Seleccione un documento del listado izquierdo para firmarlo.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
