-- CreateTable
CREATE TABLE `company_config` (
    `id` VARCHAR(191) NOT NULL DEFAULT 'DEFAULT',
    `legalName` VARCHAR(191) NOT NULL DEFAULT 'SATEM Soluciones Inteligentes SpA',
    `taxId` VARCHAR(191) NOT NULL DEFAULT '77.654.321-K',
    `address` VARCHAR(191) NOT NULL DEFAULT 'Av. Providencia 1234, Of. 601, Santiago',
    `city` VARCHAR(191) NOT NULL DEFAULT 'Santiago',
    `country` VARCHAR(191) NOT NULL DEFAULT 'Chile',
    `email` VARCHAR(191) NOT NULL DEFAULT 'contacto@satem.cl',
    `phone` VARCHAR(191) NOT NULL DEFAULT '+56 2 2999 8888',
    `website` VARCHAR(191) NOT NULL DEFAULT 'https://www.satem.cl',
    `logoFullUrl` LONGTEXT NULL,
    `logoShortUrl` LONGTEXT NULL,
    `signatureUrl` LONGTEXT NULL,
    `legalRepresentative` VARCHAR(191) NOT NULL DEFAULT 'Representante Legal SATEM',
    `legalRepresentativeTitle` VARCHAR(191) NOT NULL DEFAULT 'Gerente General',
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `document_templates` (
    `id` VARCHAR(191) NOT NULL,
    `code` VARCHAR(50) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `category` ENUM('CONTRACT', 'QUOTATION', 'WORK_ORDER', 'ATTENTION_REPORT', 'RECEPTION_CONFORMITY', 'SERVICE_REPORT', 'COMMERCIAL_PROPOSAL') NOT NULL,
    `language` VARCHAR(10) NOT NULL DEFAULT 'ES/EN',
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `currentVersion` INTEGER NOT NULL DEFAULT 1,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `document_templates_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `document_template_versions` (
    `id` VARCHAR(191) NOT NULL,
    `templateId` VARCHAR(191) NOT NULL,
    `versionNumber` INTEGER NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `htmlTemplate` LONGTEXT NOT NULL,
    `cssStyles` LONGTEXT NULL,
    `fieldsSchema` JSON NULL,
    `variablesSchema` JSON NULL,
    `headerHtml` TEXT NULL,
    `footerHtml` TEXT NULL,
    `changeReason` TEXT NOT NULL,
    `isPublished` BOOLEAN NOT NULL DEFAULT false,
    `publishedAt` DATETIME(3) NULL,
    `publishedById` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `document_template_versions_templateId_versionNumber_key`(`templateId`, `versionNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `document_instances` (
    `id` VARCHAR(191) NOT NULL,
    `documentNumber` VARCHAR(60) NOT NULL,
    `category` ENUM('CONTRACT', 'QUOTATION', 'WORK_ORDER', 'ATTENTION_REPORT', 'RECEPTION_CONFORMITY', 'SERVICE_REPORT', 'COMMERCIAL_PROPOSAL') NOT NULL,
    `templateId` VARCHAR(191) NOT NULL,
    `templateVersionId` VARCHAR(191) NOT NULL,
    `customerId` VARCHAR(191) NULL,
    `contractId` VARCHAR(191) NULL,
    `quotationId` VARCHAR(191) NULL,
    `expedientId` VARCHAR(191) NULL,
    `workOrderId` VARCHAR(191) NULL,
    `attentionId` VARCHAR(191) NULL,
    `receptionConformityId` VARCHAR(191) NULL,
    `status` ENUM('DRAFT', 'GENERATED', 'SENT', 'PENDING_SIGNATURE', 'SIGNED', 'RECEIVED', 'APPROVED', 'REJECTED', 'SUPERSEDED', 'CANCELLED') NOT NULL DEFAULT 'GENERATED',
    `dataSnapshot` JSON NOT NULL,
    `generatedHtml` LONGTEXT NOT NULL,
    `generatedPdfPath` VARCHAR(500) NOT NULL,
    `generatedPdfHash` VARCHAR(64) NOT NULL,
    `signedPdfPath` VARCHAR(500) NULL,
    `signedPdfHash` VARCHAR(64) NULL,
    `signedAt` DATETIME(3) NULL,
    `signedUploadedById` VARCHAR(191) NULL,
    `generatedById` VARCHAR(191) NOT NULL,
    `generatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `document_instances_documentNumber_key`(`documentNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `users` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `passwordHash` VARCHAR(191) NOT NULL,
    `fullName` VARCHAR(191) NOT NULL,
    `role` ENUM('ADMIN', 'OPERATIONS', 'ACCOUNTING', 'TECHNICIAN', 'VIEWER') NOT NULL DEFAULT 'OPERATIONS',
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_sessions` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `refreshToken` VARCHAR(500) NOT NULL,
    `ipAddress` VARCHAR(191) NULL,
    `userAgent` TEXT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `revokedAt` DATETIME(3) NULL,

    UNIQUE INDEX `user_sessions_refreshToken_key`(`refreshToken`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `audit_logs` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NULL,
    `action` VARCHAR(100) NOT NULL,
    `entity` VARCHAR(100) NOT NULL,
    `entityId` VARCHAR(100) NOT NULL,
    `beforeData` JSON NULL,
    `afterData` JSON NULL,
    `ipAddress` VARCHAR(191) NULL,
    `userAgent` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `audit_logs_entity_entityId_idx`(`entity`, `entityId`),
    INDEX `audit_logs_userId_idx`(`userId`),
    INDEX `audit_logs_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `countries` (
    `code` VARCHAR(3) NOT NULL,
    `name` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`code`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `customers` (
    `id` VARCHAR(191) NOT NULL,
    `code` VARCHAR(20) NOT NULL,
    `legalName` VARCHAR(191) NOT NULL,
    `tradeName` VARCHAR(191) NULL,
    `taxId` VARCHAR(191) NOT NULL,
    `countryCode` VARCHAR(3) NOT NULL,
    `address` TEXT NULL,
    `city` VARCHAR(191) NULL,
    `postalCode` VARCHAR(191) NULL,
    `phone` VARCHAR(191) NULL,
    `email` VARCHAR(191) NULL,
    `defaultCurrency` VARCHAR(3) NOT NULL DEFAULT 'USD',
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    UNIQUE INDEX `customers_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `customer_entities` (
    `id` VARCHAR(191) NOT NULL,
    `customerId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `taxId` VARCHAR(191) NULL,
    `address` TEXT NULL,
    `isPrimary` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `customer_contacts` (
    `id` VARCHAR(191) NOT NULL,
    `customerId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NULL,
    `email` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NULL,
    `contactType` ENUM('TECHNICAL', 'ADMINISTRATIVE', 'FINANCIAL', 'MANAGER', 'OTHER') NOT NULL DEFAULT 'TECHNICAL',
    `isPrimary` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `contracts` (
    `id` VARCHAR(191) NOT NULL,
    `code` VARCHAR(50) NOT NULL,
    `customerId` VARCHAR(191) NOT NULL,
    `customerEntityId` VARCHAR(191) NULL,
    `type` ENUM('HOURLY', 'PER_ATTENTION', 'ATTENTION_PACKAGE', 'FIXED_PERIOD', 'RETAINER', 'OTHER') NOT NULL,
    `modality` ENUM('ONE_TIME', 'RECURRING', 'OPEN_ENDED') NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `startDate` DATETIME(3) NOT NULL,
    `endDate` DATETIME(3) NULL,
    `currency` VARCHAR(3) NOT NULL,
    `totalAmount` DECIMAL(14, 2) NULL,
    `rate` DECIMAL(12, 2) NULL,
    `contractedHours` DECIMAL(10, 2) NULL,
    `consumedHours` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `contractedAttentions` INTEGER NULL,
    `consumedAttentions` INTEGER NOT NULL DEFAULT 0,
    `paymentTerms` TEXT NULL,
    `status` ENUM('DRAFT', 'ACTIVE', 'EXPIRED', 'EXHAUSTED', 'SUSPENDED', 'CANCELLED') NOT NULL DEFAULT 'DRAFT',
    `currentVersion` INTEGER NOT NULL DEFAULT 1,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    UNIQUE INDEX `contracts_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `contract_versions` (
    `id` VARCHAR(191) NOT NULL,
    `contractId` VARCHAR(191) NOT NULL,
    `versionNumber` INTEGER NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `startDate` DATETIME(3) NOT NULL,
    `endDate` DATETIME(3) NULL,
    `totalAmount` DECIMAL(14, 2) NULL,
    `rate` DECIMAL(12, 2) NULL,
    `contractedHours` DECIMAL(10, 2) NULL,
    `contractedAttentions` INTEGER NULL,
    `changeReason` TEXT NOT NULL,
    `createdById` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `contract_versions_contractId_versionNumber_key`(`contractId`, `versionNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `quotations` (
    `id` VARCHAR(191) NOT NULL,
    `code` VARCHAR(50) NOT NULL,
    `contractId` VARCHAR(191) NULL,
    `customerId` VARCHAR(191) NOT NULL,
    `currentVersion` INTEGER NOT NULL DEFAULT 1,
    `status` ENUM('DRAFT', 'SENT', 'APPROVED', 'REJECTED', 'EXPIRED', 'CANCELLED') NOT NULL DEFAULT 'DRAFT',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    UNIQUE INDEX `quotations_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `quotation_versions` (
    `id` VARCHAR(191) NOT NULL,
    `quotationId` VARCHAR(191) NOT NULL,
    `versionNumber` INTEGER NOT NULL,
    `versionCode` VARCHAR(60) NOT NULL,
    `currency` VARCHAR(3) NOT NULL,
    `subtotalCalculated` DECIMAL(14, 2) NOT NULL,
    `vatCalculated` DECIMAL(14, 2) NOT NULL,
    `totalCalculated` DECIMAL(14, 2) NOT NULL,
    `subtotalFinal` DECIMAL(14, 2) NOT NULL,
    `vatFinal` DECIMAL(14, 2) NOT NULL,
    `totalFinal` DECIMAL(14, 2) NOT NULL,
    `isManualOverride` BOOLEAN NOT NULL DEFAULT false,
    `overrideReason` TEXT NULL,
    `validUntil` DATETIME(3) NOT NULL,
    `commercialTerms` TEXT NULL,
    `notes` TEXT NULL,
    `createdById` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `quotation_versions_quotationId_versionNumber_key`(`quotationId`, `versionNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `quotation_items` (
    `id` VARCHAR(191) NOT NULL,
    `quotationVersionId` VARCHAR(191) NOT NULL,
    `itemOrder` INTEGER NOT NULL,
    `description` TEXT NOT NULL,
    `quantity` DECIMAL(10, 2) NOT NULL,
    `unitPrice` DECIMAL(14, 2) NOT NULL,
    `discount` DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
    `subtotal` DECIMAL(14, 2) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `expedients` (
    `id` VARCHAR(191) NOT NULL,
    `code` VARCHAR(50) NOT NULL,
    `customerId` VARCHAR(191) NOT NULL,
    `customerEntityId` VARCHAR(191) NULL,
    `contractId` VARCHAR(191) NULL,
    `quotationId` VARCHAR(191) NULL,
    `origin` ENUM('QUOTE', 'CONTRACT', 'DIRECT_REQUEST') NOT NULL DEFAULT 'DIRECT_REQUEST',
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `taxTreatment` ENUM('EXPORT_SERVICE', 'VAT_APPLIED', 'VAT_EXEMPT', 'NON_TAXABLE', 'NO_INVOICE') NOT NULL DEFAULT 'EXPORT_SERVICE',
    `vatRate` DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
    `taxJustification` TEXT NULL,
    `status` ENUM('DRAFT', 'OPEN', 'IN_PROGRESS', 'COMPLETED', 'CLOSED', 'CLOSED_WITH_EXCEPTION', 'CANCELLED') NOT NULL DEFAULT 'DRAFT',
    `closedAt` DATETIME(3) NULL,
    `closedById` VARCHAR(191) NULL,
    `closeReason` TEXT NULL,
    `closeHasException` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    UNIQUE INDEX `expedients_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `service_types` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `code` VARCHAR(20) NOT NULL,
    `description` TEXT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `service_types_name_key`(`name`),
    UNIQUE INDEX `service_types_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `work_orders` (
    `id` VARCHAR(191) NOT NULL,
    `code` VARCHAR(50) NOT NULL,
    `expedientId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `status` ENUM('DRAFT', 'AUTHORIZED', 'ASSIGNED', 'IN_PROGRESS', 'EXECUTED', 'PENDING_CONFORMITY', 'CONFORMED', 'CLOSED', 'CANCELLED') NOT NULL DEFAULT 'DRAFT',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    UNIQUE INDEX `work_orders_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `attentions` (
    `id` VARCHAR(191) NOT NULL,
    `code` VARCHAR(50) NOT NULL,
    `expedientId` VARCHAR(191) NOT NULL,
    `workOrderId` VARCHAR(191) NOT NULL,
    `contractId` VARCHAR(191) NULL,
    `serviceTypeId` VARCHAR(191) NOT NULL,
    `invoiceId` VARCHAR(191) NULL,
    `attentionDate` DATETIME(3) NOT NULL,
    `startTime` DATETIME(3) NOT NULL,
    `endTime` DATETIME(3) NOT NULL,
    `hoursWorked` DECIMAL(6, 2) NOT NULL,
    `problem` TEXT NOT NULL,
    `workDone` TEXT NOT NULL,
    `result` TEXT NOT NULL,
    `status` ENUM('REGISTERED', 'IN_PROGRESS', 'COMPLETED', 'REVIEWED', 'CANCELLED') NOT NULL DEFAULT 'COMPLETED',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    UNIQUE INDEX `attentions_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `attention_technicians` (
    `attentionId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`attentionId`, `userId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `reception_conformities` (
    `id` VARCHAR(191) NOT NULL,
    `code` VARCHAR(50) NOT NULL,
    `workOrderId` VARCHAR(191) NOT NULL,
    `receptionDate` DATETIME(3) NOT NULL,
    `acceptedByName` VARCHAR(191) NOT NULL,
    `acceptedByRole` VARCHAR(191) NULL,
    `acceptedByEmail` VARCHAR(191) NULL,
    `comments` TEXT NULL,
    `documentId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `reception_conformities_code_key`(`code`),
    UNIQUE INDEX `reception_conformities_workOrderId_key`(`workOrderId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `invoices` (
    `id` VARCHAR(191) NOT NULL,
    `code` VARCHAR(50) NOT NULL,
    `siiFolio` INTEGER NOT NULL,
    `siiDocType` INTEGER NOT NULL DEFAULT 110,
    `expedientId` VARCHAR(191) NOT NULL,
    `issueDate` DATETIME(3) NOT NULL,
    `currency` VARCHAR(3) NOT NULL,
    `netAmount` DECIMAL(14, 2) NOT NULL,
    `vatAmount` DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
    `totalAmount` DECIMAL(14, 2) NOT NULL,
    `taxTreatment` ENUM('EXPORT_SERVICE', 'VAT_APPLIED', 'VAT_EXEMPT', 'NON_TAXABLE', 'NO_INVOICE') NOT NULL,
    `status` ENUM('DRAFT', 'ISSUED', 'CANCELLED', 'VOIDED') NOT NULL DEFAULT 'ISSUED',
    `pdfDocumentId` VARCHAR(191) NULL,
    `xmlDocumentId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    UNIQUE INDEX `invoices_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payment_requests` (
    `id` VARCHAR(191) NOT NULL,
    `code` VARCHAR(50) NOT NULL,
    `invoiceId` VARCHAR(191) NOT NULL,
    `requestedAmount` DECIMAL(14, 2) NOT NULL,
    `currency` VARCHAR(3) NOT NULL,
    `exchangeRate` DECIMAL(12, 4) NOT NULL,
    `exchangeRateSource` VARCHAR(100) NOT NULL,
    `exchangeRateDate` DATETIME(3) NOT NULL,
    `targetClpEquivalent` DECIMAL(14, 2) NOT NULL,
    `estimatedFeePercent` DECIMAL(5, 2) NOT NULL,
    `suggestedClpToCharge` DECIMAL(14, 2) NOT NULL,
    `finalClpToCharge` DECIMAL(14, 2) NOT NULL,
    `isManualOverride` BOOLEAN NOT NULL DEFAULT false,
    `overrideReason` TEXT NULL,
    `sumupLink` VARCHAR(500) NULL,
    `sumupTransactionId` VARCHAR(100) NULL,
    `feeAmountClp` DECIMAL(14, 2) NULL,
    `netAmountClp` DECIMAL(14, 2) NULL,
    `paymentDate` DATETIME(3) NULL,
    `status` ENUM('PENDING', 'LINK_GENERATED', 'PARTIALLY_PAID', 'PAID', 'CANCELLED', 'EXPIRED') NOT NULL DEFAULT 'PENDING',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `payment_requests_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payments` (
    `id` VARCHAR(191) NOT NULL,
    `code` VARCHAR(50) NOT NULL,
    `paymentRequestId` VARCHAR(191) NULL,
    `paymentDate` DATETIME(3) NOT NULL,
    `amount` DECIMAL(14, 2) NOT NULL,
    `currency` VARCHAR(3) NOT NULL,
    `paymentMethod` VARCHAR(50) NOT NULL,
    `transactionRef` VARCHAR(100) NULL,
    `proofDocumentId` VARCHAR(191) NULL,
    `status` ENUM('REGISTERED', 'CONFIRMED', 'ALLOCATED', 'PARTIALLY_ALLOCATED', 'CANCELLED') NOT NULL DEFAULT 'REGISTERED',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    UNIQUE INDEX `payments_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payment_allocations` (
    `id` VARCHAR(191) NOT NULL,
    `paymentId` VARCHAR(191) NOT NULL,
    `allocatedAmount` DECIMAL(14, 2) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `bank_receipts` (
    `id` VARCHAR(191) NOT NULL,
    `code` VARCHAR(50) NOT NULL,
    `bankName` VARCHAR(191) NOT NULL DEFAULT 'Banco Santander Chile',
    `accountNumber` VARCHAR(50) NOT NULL,
    `transactionDate` DATETIME(3) NOT NULL,
    `description` TEXT NOT NULL,
    `amountClp` DECIMAL(14, 2) NOT NULL,
    `referenceNumber` VARCHAR(100) NULL,
    `rawSourceFileId` VARCHAR(191) NULL,
    `status` ENUM('UNRECONCILED', 'PARTIALLY_RECONCILED', 'RECONCILED', 'DISCREPANCY') NOT NULL DEFAULT 'UNRECONCILED',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `bank_receipts_code_key`(`code`),
    INDEX `bank_receipts_transactionDate_amountClp_referenceNumber_idx`(`transactionDate`, `amountClp`, `referenceNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `bank_reconciliations` (
    `id` VARCHAR(191) NOT NULL,
    `bankReceiptId` VARCHAR(191) NOT NULL,
    `paymentAllocationId` VARCHAR(191) NOT NULL,
    `reconciliationDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `expectedAmountClp` DECIMAL(14, 2) NOT NULL,
    `receivedAmountClp` DECIMAL(14, 2) NOT NULL,
    `discrepancyAmountClp` DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
    `notes` TEXT NULL,
    `reconciledById` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `expedient_integrity_items` (
    `id` VARCHAR(191) NOT NULL,
    `expedientId` VARCHAR(191) NOT NULL,
    `code` VARCHAR(50) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `category` VARCHAR(50) NOT NULL,
    `isRequired` BOOLEAN NOT NULL DEFAULT true,
    `status` ENUM('COMPLETED', 'PENDING', 'UNFULFILLED', 'NOT_APPLICABLE') NOT NULL DEFAULT 'PENDING',
    `entityType` VARCHAR(50) NULL,
    `entityId` VARCHAR(100) NULL,
    `documentId` VARCHAR(191) NULL,
    `observation` TEXT NULL,
    `completedAt` DATETIME(3) NULL,
    `completedById` VARCHAR(191) NULL,

    UNIQUE INDEX `expedient_integrity_items_expedientId_code_key`(`expedientId`, `code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `system_exceptions` (
    `id` VARCHAR(191) NOT NULL,
    `expedientId` VARCHAR(191) NULL,
    `exceptionType` VARCHAR(50) NOT NULL,
    `severity` ENUM('INFO', 'WARNING', 'CRITICAL') NOT NULL DEFAULT 'WARNING',
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NOT NULL,
    `entityType` VARCHAR(50) NULL,
    `entityId` VARCHAR(100) NULL,
    `status` ENUM('OPEN', 'ACKNOWLEDGED', 'RESOLVED', 'DISMISSED') NOT NULL DEFAULT 'OPEN',
    `resolvedAt` DATETIME(3) NULL,
    `resolvedById` VARCHAR(191) NULL,
    `resolutionNote` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `system_exceptions_status_severity_idx`(`status`, `severity`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `alert_rules` (
    `id` VARCHAR(191) NOT NULL,
    `code` VARCHAR(50) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `targetEntity` VARCHAR(50) NOT NULL,
    `triggerCondition` VARCHAR(100) NOT NULL,
    `daysThreshold` INTEGER NULL,
    `percentThreshold` DECIMAL(5, 2) NULL,
    `severity` ENUM('INFO', 'WARNING', 'CRITICAL') NOT NULL DEFAULT 'WARNING',
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `alert_rules_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `expedient_snapshots` (
    `id` VARCHAR(191) NOT NULL,
    `expedientId` VARCHAR(191) NOT NULL,
    `snapshotData` JSON NOT NULL,
    `checksumSha256` VARCHAR(64) NOT NULL,
    `closedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `closedById` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `documents` (
    `id` VARCHAR(191) NOT NULL,
    `originalName` VARCHAR(191) NOT NULL,
    `internalName` VARCHAR(191) NOT NULL,
    `mimeType` VARCHAR(100) NOT NULL,
    `fileSize` BIGINT NOT NULL,
    `sha256` VARCHAR(64) NOT NULL,
    `storagePath` VARCHAR(500) NOT NULL,
    `category` ENUM('CONTRACT', 'SOW', 'QUOTATION', 'WORK_ORDER', 'ATTENTION', 'RECEPTION', 'INVOICE', 'SUMUP_PROOF', 'PAYMENT_PROOF', 'BANK_RECEIPT', 'EVIDENCE', 'REPORT', 'OTHER') NOT NULL DEFAULT 'EVIDENCE',
    `uploadedById` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `documents_internalName_key`(`internalName`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `document_links` (
    `id` VARCHAR(191) NOT NULL,
    `documentId` VARCHAR(191) NOT NULL,
    `entityType` VARCHAR(50) NOT NULL,
    `entityId` VARCHAR(100) NOT NULL,
    `expedientId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `document_links_entityType_entityId_idx`(`entityType`, `entityId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sequences` (
    `prefix` VARCHAR(10) NOT NULL,
    `year` INTEGER NOT NULL,
    `currentValue` INTEGER NOT NULL DEFAULT 0,

    PRIMARY KEY (`prefix`, `year`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `exchange_rates` (
    `id` VARCHAR(191) NOT NULL,
    `currencyFrom` VARCHAR(3) NOT NULL,
    `currencyTo` VARCHAR(3) NOT NULL,
    `rate` DECIMAL(12, 4) NOT NULL,
    `rateDate` DATETIME(3) NOT NULL,
    `source` VARCHAR(100) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `exchange_rates_currencyFrom_currencyTo_rateDate_source_key`(`currencyFrom`, `currencyTo`, `rateDate`, `source`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `document_template_versions` ADD CONSTRAINT `document_template_versions_templateId_fkey` FOREIGN KEY (`templateId`) REFERENCES `document_templates`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `document_instances` ADD CONSTRAINT `document_instances_templateId_fkey` FOREIGN KEY (`templateId`) REFERENCES `document_templates`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `document_instances` ADD CONSTRAINT `document_instances_templateVersionId_fkey` FOREIGN KEY (`templateVersionId`) REFERENCES `document_template_versions`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `document_instances` ADD CONSTRAINT `document_instances_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `customers`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `document_instances` ADD CONSTRAINT `document_instances_contractId_fkey` FOREIGN KEY (`contractId`) REFERENCES `contracts`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `document_instances` ADD CONSTRAINT `document_instances_quotationId_fkey` FOREIGN KEY (`quotationId`) REFERENCES `quotations`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `document_instances` ADD CONSTRAINT `document_instances_expedientId_fkey` FOREIGN KEY (`expedientId`) REFERENCES `expedients`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_sessions` ADD CONSTRAINT `user_sessions_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `audit_logs` ADD CONSTRAINT `audit_logs_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `customers` ADD CONSTRAINT `customers_countryCode_fkey` FOREIGN KEY (`countryCode`) REFERENCES `countries`(`code`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `customer_entities` ADD CONSTRAINT `customer_entities_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `customers`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `customer_contacts` ADD CONSTRAINT `customer_contacts_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `customers`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `contracts` ADD CONSTRAINT `contracts_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `customers`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `contracts` ADD CONSTRAINT `contracts_customerEntityId_fkey` FOREIGN KEY (`customerEntityId`) REFERENCES `customer_entities`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `contract_versions` ADD CONSTRAINT `contract_versions_contractId_fkey` FOREIGN KEY (`contractId`) REFERENCES `contracts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `quotations` ADD CONSTRAINT `quotations_contractId_fkey` FOREIGN KEY (`contractId`) REFERENCES `contracts`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `quotations` ADD CONSTRAINT `quotations_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `customers`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `quotation_versions` ADD CONSTRAINT `quotation_versions_quotationId_fkey` FOREIGN KEY (`quotationId`) REFERENCES `quotations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `quotation_items` ADD CONSTRAINT `quotation_items_quotationVersionId_fkey` FOREIGN KEY (`quotationVersionId`) REFERENCES `quotation_versions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `expedients` ADD CONSTRAINT `expedients_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `customers`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `expedients` ADD CONSTRAINT `expedients_customerEntityId_fkey` FOREIGN KEY (`customerEntityId`) REFERENCES `customer_entities`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `expedients` ADD CONSTRAINT `expedients_contractId_fkey` FOREIGN KEY (`contractId`) REFERENCES `contracts`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `expedients` ADD CONSTRAINT `expedients_quotationId_fkey` FOREIGN KEY (`quotationId`) REFERENCES `quotations`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `expedients` ADD CONSTRAINT `expedients_closedById_fkey` FOREIGN KEY (`closedById`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `work_orders` ADD CONSTRAINT `work_orders_expedientId_fkey` FOREIGN KEY (`expedientId`) REFERENCES `expedients`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `attentions` ADD CONSTRAINT `attentions_expedientId_fkey` FOREIGN KEY (`expedientId`) REFERENCES `expedients`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `attentions` ADD CONSTRAINT `attentions_workOrderId_fkey` FOREIGN KEY (`workOrderId`) REFERENCES `work_orders`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `attentions` ADD CONSTRAINT `attentions_contractId_fkey` FOREIGN KEY (`contractId`) REFERENCES `contracts`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `attentions` ADD CONSTRAINT `attentions_serviceTypeId_fkey` FOREIGN KEY (`serviceTypeId`) REFERENCES `service_types`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `attentions` ADD CONSTRAINT `attentions_invoiceId_fkey` FOREIGN KEY (`invoiceId`) REFERENCES `invoices`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `attention_technicians` ADD CONSTRAINT `attention_technicians_attentionId_fkey` FOREIGN KEY (`attentionId`) REFERENCES `attentions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `attention_technicians` ADD CONSTRAINT `attention_technicians_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reception_conformities` ADD CONSTRAINT `reception_conformities_workOrderId_fkey` FOREIGN KEY (`workOrderId`) REFERENCES `work_orders`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reception_conformities` ADD CONSTRAINT `reception_conformities_documentId_fkey` FOREIGN KEY (`documentId`) REFERENCES `documents`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `invoices` ADD CONSTRAINT `invoices_expedientId_fkey` FOREIGN KEY (`expedientId`) REFERENCES `expedients`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `invoices` ADD CONSTRAINT `invoices_pdfDocumentId_fkey` FOREIGN KEY (`pdfDocumentId`) REFERENCES `documents`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `invoices` ADD CONSTRAINT `invoices_xmlDocumentId_fkey` FOREIGN KEY (`xmlDocumentId`) REFERENCES `documents`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payment_requests` ADD CONSTRAINT `payment_requests_invoiceId_fkey` FOREIGN KEY (`invoiceId`) REFERENCES `invoices`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payments` ADD CONSTRAINT `payments_paymentRequestId_fkey` FOREIGN KEY (`paymentRequestId`) REFERENCES `payment_requests`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payments` ADD CONSTRAINT `payments_proofDocumentId_fkey` FOREIGN KEY (`proofDocumentId`) REFERENCES `documents`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payment_allocations` ADD CONSTRAINT `payment_allocations_paymentId_fkey` FOREIGN KEY (`paymentId`) REFERENCES `payments`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bank_receipts` ADD CONSTRAINT `bank_receipts_rawSourceFileId_fkey` FOREIGN KEY (`rawSourceFileId`) REFERENCES `documents`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bank_reconciliations` ADD CONSTRAINT `bank_reconciliations_bankReceiptId_fkey` FOREIGN KEY (`bankReceiptId`) REFERENCES `bank_receipts`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bank_reconciliations` ADD CONSTRAINT `bank_reconciliations_paymentAllocationId_fkey` FOREIGN KEY (`paymentAllocationId`) REFERENCES `payment_allocations`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `expedient_integrity_items` ADD CONSTRAINT `expedient_integrity_items_expedientId_fkey` FOREIGN KEY (`expedientId`) REFERENCES `expedients`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `expedient_integrity_items` ADD CONSTRAINT `expedient_integrity_items_documentId_fkey` FOREIGN KEY (`documentId`) REFERENCES `documents`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `system_exceptions` ADD CONSTRAINT `system_exceptions_expedientId_fkey` FOREIGN KEY (`expedientId`) REFERENCES `expedients`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `system_exceptions` ADD CONSTRAINT `system_exceptions_resolvedById_fkey` FOREIGN KEY (`resolvedById`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `expedient_snapshots` ADD CONSTRAINT `expedient_snapshots_expedientId_fkey` FOREIGN KEY (`expedientId`) REFERENCES `expedients`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `documents` ADD CONSTRAINT `documents_uploadedById_fkey` FOREIGN KEY (`uploadedById`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `document_links` ADD CONSTRAINT `document_links_documentId_fkey` FOREIGN KEY (`documentId`) REFERENCES `documents`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `document_links` ADD CONSTRAINT `document_links_expedientId_fkey` FOREIGN KEY (`expedientId`) REFERENCES `expedients`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

