-- CreateTable
CREATE TABLE "inventory" (
    "id" SERIAL NOT NULL,
    "inventory_name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "photo" TEXT,

    CONSTRAINT "inventory_pkey" PRIMARY KEY ("id")
);
