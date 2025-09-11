import { IsArray, IsBoolean, IsMongoId, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class PerformedSetInputDto {
  @IsNotEmpty()
  @IsString()
  setId: string;

  @IsOptional()
  @IsBoolean()
  completed?: boolean;

  @IsOptional()
  repsPerformed?: number | null;

  @IsOptional()
  loadUsed?: number | null;

  @IsOptional()
  measureAchieved?: number | null;
}

export class SubmitPerformedSetsDto {
  @IsNotEmpty()
  @IsMongoId()
  planId: string;

  @IsNotEmpty()
  @IsString()
  sessionId: string;

  @IsNotEmpty()
  @IsString()
  exerciseId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PerformedSetInputDto)
  sets: PerformedSetInputDto[];
}


