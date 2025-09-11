import { IsString, IsNotEmpty, IsOptional, IsMongoId } from 'class-validator';

export class CreateTemplateFromPlanDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsMongoId()
  @IsNotEmpty()
  planId: string;

  @IsMongoId()
  @IsNotEmpty()
  createdBy: string;
}
