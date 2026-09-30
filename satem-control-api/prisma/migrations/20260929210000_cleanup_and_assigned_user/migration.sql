-- AlterTable: Add assignedUserId to system_exceptions
ALTER TABLE `system_exceptions` ADD COLUMN `assignedUserId` VARCHAR(191) NULL;

-- AddForeignKey
ALTER TABLE `system_exceptions` ADD CONSTRAINT `system_exceptions_assignedUserId_fkey` FOREIGN KEY (`assignedUserId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- Drop obsolete tables if they exist
DROP TABLE IF EXISTS `quotation_items`;
DROP TABLE IF EXISTS `quotation_versions`;
DROP TABLE IF EXISTS `quotations`;
DROP TABLE IF EXISTS `alert_rules`;
