import { PRODUCT_STATUS, SALE_STATUS, DELIVERY_STATUS } from '../constants/status';

export function isValidProductStatus(status: string): boolean {
  return Object.values(PRODUCT_STATUS).includes(status as any);
}

export function isValidSaleStatus(status: string): boolean {
  return Object.values(SALE_STATUS).includes(status as any);
}

export function isValidDeliveryStatus(status: string): boolean {
  return Object.values(DELIVERY_STATUS).includes(status as any);
}

interface ProductData {
  name: string;
  type: string;
  description?: string;
  costPrice: number;
  profitMargin: number;
  salePrice: number;
  quantity: number;
  code?: string;
  status?: string;
  reserved?: boolean;
  sold?: boolean;
}

export function validateProduct(data: ProductData): string[] {
  const errors: string[] = [];

  // Campos obrigatórios
  if (!data.name?.trim()) {
    errors.push('Nome é obrigatório');
  }

  if (!data.type?.trim()) {
    errors.push('Tipo é obrigatório');
  }

  // Validações de valores numéricos
  if (typeof data.costPrice !== 'number' || data.costPrice <= 0) {
    errors.push('Preço de custo deve ser um número maior que zero');
  }

  if (typeof data.profitMargin !== 'number' || data.profitMargin < 0) {
    errors.push('Margem de lucro deve ser um número maior ou igual a zero');
  }

  if (typeof data.salePrice !== 'number' || data.salePrice <= 0) {
    errors.push('Preço de venda deve ser um número maior que zero');
  }

  if (typeof data.quantity !== 'number' || data.quantity < 0 || !Number.isInteger(data.quantity)) {
    errors.push('Quantidade deve ser um número inteiro maior ou igual a zero');
  }

  // Validação do preço de venda em relação ao preço de custo
  if (data.salePrice < data.costPrice) {
    errors.push('Preço de venda não pode ser menor que o preço de custo');
  }

  // Validação de campos booleanos
  if (data.reserved !== undefined && typeof data.reserved !== 'boolean') {
    errors.push('Campo reservado deve ser um valor booleano');
  }

  if (data.sold !== undefined && typeof data.sold !== 'boolean') {
    errors.push('Campo vendido deve ser um valor booleano');
  }

  return errors;
}

export function validateSale(data: any): string[] {
  const errors: string[] = [];

  if (!data.clientId) errors.push('Cliente é obrigatório');
  if (!data.products || !Array.isArray(data.products) || data.products.length === 0) {
    errors.push('Produtos são obrigatórios');
  }
  if (!data.total || data.total <= 0) errors.push('Total deve ser maior que zero');
  if (data.status && !isValidSaleStatus(data.status)) errors.push('Status inválido');

  return errors;
}

export function validateDelivery(data: any): string[] {
  const errors: string[] = [];

  if (!data.saleId) errors.push('Venda é obrigatória');
  if (!data.address) errors.push('Endereço é obrigatório');
  if (data.status && !isValidDeliveryStatus(data.status)) errors.push('Status inválido');
  if (data.date && isNaN(new Date(data.date).getTime())) errors.push('Data inválida');

  return errors;
} 