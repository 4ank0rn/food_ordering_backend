import { IsNumber, IsOptional, Min } from 'class-validator';

export class CreateTableDto {
  @IsNumber()
  tableNumber: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  capacity?: number;
}
