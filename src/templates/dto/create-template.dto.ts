import { IsString, IsArray, IsNotEmpty, ValidateNested, IsEnum, IsOptional, IsMongoId, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { TemplateType, TemplatePredefinedCategory } from '../schemas/template.schema';

class PerformedSetDto {
  @IsNotEmpty()
  setNumber: number;

  repsPerformed?: number;
  loadUsed?: number;
  measureAchieved?: number;
  notes?: string;
}

class ExerciseDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNotEmpty()
  sets: number;

  @IsNotEmpty()
  reps: number;

  rpe?: number;
  rir?: number;
  rm?: number;
  notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PerformedSetDto)
  performedSets: PerformedSetDto[];
}

class SessionDto {
  @IsString()
  @IsNotEmpty()
  sessionName: string;

  @IsString()
  @IsNotEmpty()
  date: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExerciseDto)
  exercises: ExerciseDto[];
}

export class CreateTemplateDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsEnum(TemplateType)
  type: TemplateType;

  @IsOptional()
  @IsEnum(TemplatePredefinedCategory)
  predefinedCategory?: TemplatePredefinedCategory;

  @IsOptional()
  @IsMongoId()
  createdBy?: string;

  @IsOptional()
  @IsMongoId()
  originalPlanId?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SessionDto)
  sessions: SessionDto[];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
