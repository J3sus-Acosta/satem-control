-- Disable foreign key checks for safe schema modifications
SET FOREIGN_KEY_CHECKS = 0;

-- 1. AlterTable: Add columns to payments
ALTER TABLE `payments` ADD COLUMN `usdEquivalent` DECIMAL(14, 2) NULL;
ALTER TABLE `payments` ADD COLUMN `exchangeRate` DECIMAL(12, 4) NULL;

-- 2. CreateTable: client_users
CREATE TABLE `client_users` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `passwordHash` VARCHAR(191) NOT NULL,
    `fullName` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NULL,
    `customerId` VARCHAR(191) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `inviteToken` VARCHAR(100) NULL,
    `invitedAt` DATETIME(3) NULL,
    `lastLoginAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    UNIQUE INDEX `client_users_email_key`(`email`),
    UNIQUE INDEX `client_users_inviteToken_key`(`inviteToken`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 3. CreateTable: client_user_sessions
CREATE TABLE `client_user_sessions` (
    `id` VARCHAR(191) NOT NULL,
    `clientUserId` VARCHAR(191) NOT NULL,
    `refreshToken` VARCHAR(500) NOT NULL,
    `ipAddress` VARCHAR(191) NULL,
    `userAgent` TEXT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `revokedAt` DATETIME(3) NULL,

    UNIQUE INDEX `client_user_sessions_refreshToken_key`(`refreshToken`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 4. CreateTable: client_user_entity_access
CREATE TABLE `client_user_entity_access` (
    `id` VARCHAR(191) NOT NULL,
    `clientUserId` VARCHAR(191) NOT NULL,
    `customerEntityId` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `client_user_entity_access_clientUserId_customerEntityId_key`(`clientUserId`, `customerEntityId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 5. CreateTable: document_signatures
CREATE TABLE `document_signatures` (
    `id` VARCHAR(191) NOT NULL,
    `documentInstanceId` VARCHAR(191) NOT NULL,
    `role` ENUM('CLIENT', 'SATEM') NOT NULL,
    `status` ENUM('PENDING', 'SIGNED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    `signerName` VARCHAR(191) NOT NULL,
    `signerEmail` VARCHAR(191) NOT NULL,
    `signatureImagePath` VARCHAR(500) NULL,
    `signedAt` DATETIME(3) NULL,
    `ipAddress` VARCHAR(191) NULL,
    `userAgent` TEXT NULL,
    `clientUserId` VARCHAR(191) NULL,
    `internalUserId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 6. Add Foreign Keys
ALTER TABLE `client_users` ADD CONSTRAINT `client_users_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `customers`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `client_user_sessions` ADD CONSTRAINT `client_user_sessions_clientUserId_fkey` FOREIGN KEY (`clientUserId`) REFERENCES `client_users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `client_user_entity_access` ADD CONSTRAINT `client_user_entity_access_clientUserId_fkey` FOREIGN KEY (`clientUserId`) REFERENCES `client_users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `client_user_entity_access` ADD CONSTRAINT `client_user_entity_access_customerEntityId_fkey` FOREIGN KEY (`customerEntityId`) REFERENCES `customer_entities`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `document_signatures` ADD CONSTRAINT `document_signatures_documentInstanceId_fkey` FOREIGN KEY (`documentInstanceId`) REFERENCES `document_instances`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `document_signatures` ADD CONSTRAINT `document_signatures_clientUserId_fkey` FOREIGN KEY (`clientUserId`) REFERENCES `client_users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- Enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;
