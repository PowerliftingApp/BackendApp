import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreateTrainingPlanDto } from './create-training-plan.dto';
import { IsArray, IsDateString, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class UpdateSessionDto {
  @IsString()
  @IsNotEmpty()
  sessionName: string;

  @IsDateString()
  @IsNotEmpty()
  date: string;
}

// Omitimos 'sessions' del DTO base para redefinirlo con nuestras reglas de validación
export class UpdateTrainingPlanDto extends PartialType(
  OmitType(CreateTrainingPlanDto, ['sessions'] as const),
) {
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateSessionDto)
  sessions?: UpdateSessionDto[];
}
