/*
  Warnings:

  - You are about to alter the column `description` on the `permissions` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(200)`.
  - You are about to alter the column `description` on the `roles` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(200)`.

*/
-- AlterTable
ALTER TABLE "permissions" ALTER COLUMN "description" SET DATA TYPE VARCHAR(200);

-- AlterTable
ALTER TABLE "roles" ALTER COLUMN "description" SET DATA TYPE VARCHAR(200);
