import { IsString, IsDate, IsArray, IsNotEmpty, ValidateNested, IsOptional, IsBoolean, IsMongoId } from 'class-validator';
import { Type } from 'class-transformer';

class PerformedSetDto {
  @IsNotEmpty()
  setNumber: number;

  repsPerformed?: number;
  loadUsed?: number;
  measureAchieved?: number;
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
  @IsOptional()
  performedSets?: PerformedSetDto[];
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

export class CreateTrainingPlanDto {
  @IsString()
  @IsNotEmpty()
  athleteId: string;

  @IsString()
  @IsNotEmpty()
  coachId: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  startDate: string;

  @IsString()
  @IsNotEmpty()
  endDate: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SessionDto)
  sessions: SessionDto[];

  @IsOptional()
  @IsBoolean()
  isTemplate?: boolean;

  @IsOptional()
  @IsMongoId()
  templateId?: string;
}
