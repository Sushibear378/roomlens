-- CreateEnum
CREATE TYPE "DesignStatus" AS ENUM ('PROCESSING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "RoomUpload" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "originalUrl" TEXT NOT NULL,
    "roomType" TEXT NOT NULL,
    "style" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RoomUpload_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GeneratedDesign" (
    "id" TEXT NOT NULL,
    "roomUploadId" TEXT NOT NULL,
    "generatedUrl" TEXT,
    "status" "DesignStatus" NOT NULL DEFAULT 'PROCESSING',
    "replicateId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GeneratedDesign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MatchedProduct" (
    "id" TEXT NOT NULL,
    "generatedDesignId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "productUrl" TEXT NOT NULL,
    "category" TEXT NOT NULL,

    CONSTRAINT "MatchedProduct_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "GeneratedDesign" ADD CONSTRAINT "GeneratedDesign_roomUploadId_fkey" FOREIGN KEY ("roomUploadId") REFERENCES "RoomUpload"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchedProduct" ADD CONSTRAINT "MatchedProduct_generatedDesignId_fkey" FOREIGN KEY ("generatedDesignId") REFERENCES "GeneratedDesign"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
