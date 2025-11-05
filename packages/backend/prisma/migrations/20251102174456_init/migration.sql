-- CreateTable
CREATE TABLE "roles" (
    "id" SERIAL NOT NULL,
    "name" TEXT,
    "description" TEXT,
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");

-- CreateIndex
CREATE INDEX "roles_name_idx" ON "roles"("name");

-- CreateIndex
CREATE INDEX "roles_created_at_idx" ON "roles"("created_at");

-- CreateIndex
CREATE INDEX "roles_updated_at_idx" ON "roles"("updated_at");

-- CreateIndex
CREATE INDEX "roles_deleted_at_idx" ON "roles"("deleted_at");
