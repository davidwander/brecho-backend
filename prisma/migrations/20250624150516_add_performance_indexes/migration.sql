-- CreateIndex
CREATE INDEX "Client_name_idx" ON "Client"("name");

-- CreateIndex
CREATE INDEX "Client_email_idx" ON "Client"("email");

-- CreateIndex
CREATE INDEX "Client_phone_idx" ON "Client"("phone");

-- CreateIndex
CREATE INDEX "Client_createdAt_idx" ON "Client"("createdAt");

-- CreateIndex
CREATE INDEX "Delivery_status_idx" ON "Delivery"("status");

-- CreateIndex
CREATE INDEX "Delivery_date_idx" ON "Delivery"("date");

-- CreateIndex
CREATE INDEX "Delivery_createdAt_idx" ON "Delivery"("createdAt");

-- CreateIndex
CREATE INDEX "Product_status_idx" ON "Product"("status");

-- CreateIndex
CREATE INDEX "Product_type_idx" ON "Product"("type");

-- CreateIndex
CREATE INDEX "Product_code_idx" ON "Product"("code");

-- CreateIndex
CREATE INDEX "Product_sold_idx" ON "Product"("sold");

-- CreateIndex
CREATE INDEX "Product_reserved_idx" ON "Product"("reserved");

-- CreateIndex
CREATE INDEX "Product_createdAt_idx" ON "Product"("createdAt");

-- CreateIndex
CREATE INDEX "Product_name_idx" ON "Product"("name");

-- CreateIndex
CREATE INDEX "Sale_clientId_idx" ON "Sale"("clientId");

-- CreateIndex
CREATE INDEX "Sale_userId_idx" ON "Sale"("userId");

-- CreateIndex
CREATE INDEX "Sale_status_idx" ON "Sale"("status");

-- CreateIndex
CREATE INDEX "Sale_createdAt_idx" ON "Sale"("createdAt");

-- CreateIndex
CREATE INDEX "Sale_paymentType_idx" ON "Sale"("paymentType");

-- CreateIndex
CREATE INDEX "SaleProduct_saleId_idx" ON "SaleProduct"("saleId");

-- CreateIndex
CREATE INDEX "SaleProduct_productId_idx" ON "SaleProduct"("productId");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_createdAt_idx" ON "User"("createdAt");
