export class CreateOrderItemDto {
  menuItemId: number;
  quantity: number;
  note?: string;
}
export class CreateOrderDto {
  sessionId?: string;
  tableId?: number;
  items: CreateOrderItemDto[];
}
