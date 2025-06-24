/*
  Warnings:

  - You are about to drop the column `price` on the `Product` table. All the data in the column will be lost.
  - Added the required column `costPrice` to the `Product` table without a default value. This is not possible if the table is not empty.
  - Added the required column `profitMargin` to the `Product` table without a default value. This is not possible if the table is not empty.
  - Added the required column `salePrice` to the `Product` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Product" DROP COLUMN "price",
ADD COLUMN     "costPrice" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "profitMargin" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "reserved" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "salePrice" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "sold" BOOLEAN NOT NULL DEFAULT false;
