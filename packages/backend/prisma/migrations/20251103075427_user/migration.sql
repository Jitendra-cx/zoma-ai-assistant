/*
  Warnings:

  - You are about to alter the column `name` on the `permissions` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(100)`.
  - You are about to alter the column `name` on the `roles` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(100)`.
  - A unique constraint covering the columns `[role_id,permission_id]` on the table `role_permissions` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "permissions" ALTER COLUMN "name" SET DATA TYPE VARCHAR(100);

-- AlterTable
ALTER TABLE "role_permissions" ALTER COLUMN "role_id" DROP NOT NULL,
ALTER COLUMN "permission_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "roles" ALTER COLUMN "name" SET DATA TYPE VARCHAR(100);

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100),
    "email" VARCHAR(100),
    "password" VARCHAR(200),
    "role_id" INTEGER,
    "is_active" BOOLEAN DEFAULT true,
    "login_at" TIMESTAMP(3),
    "token_version" INTEGER DEFAULT 0,
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_created_at_idx" ON "users"("created_at");

-- CreateIndex
CREATE INDEX "users_updated_at_idx" ON "users"("updated_at");

-- CreateIndex
CREATE INDEX "users_deleted_at_idx" ON "users"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "role_permissions_role_id_permission_id_key" ON "role_permissions"("role_id", "permission_id");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
