-- =========================================================================
-- SATEM CONTROL - SCRIPT DE PURGA SEGURA DE DATOS DE PRUEBA
-- =========================================================================
-- CONSERVA: Identidad Corporativa (company_config), Plantillas (document_templates),
--           Países (countries), Tipos de Servicio (service_types), Reglas de Alerta (alert_rules)
--           y Cuentas de Usuario (users).
--
-- RESETEA: Folios y secuencias (sequences) a 0 para que inicien desde 001.
-- =========================================================================

SET FOREIGN_KEY_CHECKS = 0;

-- 1. Conciliación bancaria, links de cobro y pagos
TRUNCATE TABLE bank_reconciliations;
TRUNCATE TABLE bank_receipts;
TRUNCATE TABLE payment_allocations;
TRUNCATE TABLE sumup_transactions;
TRUNCATE TABLE payment_requests;
TRUNCATE TABLE payments;
TRUNCATE TABLE invoices;

-- 2. Expedientes, atenciones, recepciones conformes y órdenes de trabajo
TRUNCATE TABLE expedient_integrity_items;
TRUNCATE TABLE system_exceptions;
TRUNCATE TABLE expedient_snapshots;
TRUNCATE TABLE reception_conformities;
TRUNCATE TABLE attention_technicians;
TRUNCATE TABLE attentions;
TRUNCATE TABLE work_orders;
TRUNCATE TABLE expedients;

-- 3. Documentos generados, archivos y links
TRUNCATE TABLE document_instances;
TRUNCATE TABLE document_links;
TRUNCATE TABLE documents;

-- 4. Cotizaciones y Contratos / SOW
TRUNCATE TABLE quotation_items;
TRUNCATE TABLE quotation_versions;
TRUNCATE TABLE quotations;
TRUNCATE TABLE contract_versions;
TRUNCATE TABLE contracts;

-- 5. Clientes y entidades
TRUNCATE TABLE customer_contacts;
TRUNCATE TABLE customer_entities;
TRUNCATE TABLE customers;

-- 6. Auditoría y sesiones
TRUNCATE TABLE audit_logs;
TRUNCATE TABLE user_sessions;

-- 7. REINICIO DE FOLIOS Y CORRELATIVOS (Próximo folio será 001)
TRUNCATE TABLE sequences;

SET FOREIGN_KEY_CHECKS = 1;

-- =========================================================================
-- ¡PURGA COMPLETADA!
-- =========================================================================
