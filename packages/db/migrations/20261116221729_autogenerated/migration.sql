CREATE TABLE `transaction` (
	`id` text PRIMARY KEY,
	`group_id` text NOT NULL,
	`amount` real NOT NULL,
	`from_id` text NOT NULL,
	`to_id` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`created_by_id` text NOT NULL,
	CONSTRAINT `fk_transaction_group_id_group_id_fk` FOREIGN KEY (`group_id`) REFERENCES `group`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_transaction_from_id_user_id_fk` FOREIGN KEY (`from_id`) REFERENCES `user`(`id`),
	CONSTRAINT `fk_transaction_to_id_user_id_fk` FOREIGN KEY (`to_id`) REFERENCES `user`(`id`),
	CONSTRAINT `fk_transaction_created_by_id_user_id_fk` FOREIGN KEY (`created_by_id`) REFERENCES `user`(`id`)
);
--> statement-breakpoint
ALTER TABLE `trip` ADD `paid_by_id` text REFERENCES user(id);--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_invite` (
	`code` text PRIMARY KEY,
	`group_id` text NOT NULL,
	`expires` integer NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`created_by_id` text NOT NULL,
	CONSTRAINT `fk_invite_group_id_group_id_fk` FOREIGN KEY (`group_id`) REFERENCES `group`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_invite_created_by_id_user_id_fk` FOREIGN KEY (`created_by_id`) REFERENCES `user`(`id`)
);
--> statement-breakpoint
INSERT INTO `__new_invite`(`code`, `group_id`, `expires`, `created_at`, `created_by_id`) SELECT `code`, `group_id`, `expires`, `created_at`, `created_by_id` FROM `invite`;--> statement-breakpoint
DROP TABLE `invite`;--> statement-breakpoint
ALTER TABLE `__new_invite` RENAME TO `invite`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_trip` (
	`id` text PRIMARY KEY,
	`name` text NOT NULL,
	`group_id` text NOT NULL,
	`paid_by_id` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`created_by_id` text NOT NULL,
	CONSTRAINT `fk_trip_group_id_group_id_fk` FOREIGN KEY (`group_id`) REFERENCES `group`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_trip_paid_by_id_user_id_fk` FOREIGN KEY (`paid_by_id`) REFERENCES `user`(`id`),
	CONSTRAINT `fk_trip_created_by_id_user_id_fk` FOREIGN KEY (`created_by_id`) REFERENCES `user`(`id`)
);
--> statement-breakpoint
INSERT INTO `__new_trip`(`id`, `name`, `group_id`, `created_at`, `created_by_id`) SELECT `id`, `name`, `group_id`, `created_at`, `created_by_id` FROM `trip`;--> statement-breakpoint
DROP TABLE `trip`;--> statement-breakpoint
ALTER TABLE `__new_trip` RENAME TO `trip`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
DROP INDEX IF EXISTS `trip_groupId_idx`;--> statement-breakpoint
DROP INDEX IF EXISTS `item_groupId_idx`;--> statement-breakpoint
DROP INDEX IF EXISTS `item_groupId_tripId_idx`;--> statement-breakpoint
CREATE INDEX `invite_groupId_idx` ON `invite` (`group_id`);--> statement-breakpoint
CREATE INDEX `trip_groupId_createdAt_idx` ON `trip` (`group_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `item_groupId_tripId_createdAt_idx` ON `item` (`group_id`,`trip_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `item_groupId_tripId_name_idx` ON `item` (`group_id`,`trip_id`,`name`);--> statement-breakpoint
CREATE INDEX `transaction_groupId_createdAt_idx` ON `transaction` (`group_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `transaction_groupId_fromId_idx` ON `transaction` (`group_id`,`from_id`);--> statement-breakpoint
CREATE INDEX `transaction_groupId_toId_idx` ON `transaction` (`group_id`,`to_id`);