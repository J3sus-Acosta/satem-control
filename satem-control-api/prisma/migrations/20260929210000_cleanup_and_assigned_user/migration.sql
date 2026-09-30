-- Disable foreign key checks for safe table drops and schema adjustments
SET FOREIGN_KEY_CHECKS = 0;

-- AlterTable: Add assignedUserId to system_exceptions (if column doesn't exist)
ALTER TABLE `system_exceptions` ADD COLUMN `assignedUserId` VARCHAR(191) NULL;

-- Drop obsolete tables and references
DROP TABLE IF EXISTS `quotation_items`;
DROP TABLE IF EXISTS `quotation_versions`;
DROP TABLE IF EXISTS `quotations`;
DROP TABLE IF EXISTS `alert_rules`;

-- Enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- AddForeignKey safely
ALTER TABLE `system_exceptions` ADD CONSTRAINT `system_exceptions_assignedUserId_fkey` FOREIGN KEY (`assignedUserId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
