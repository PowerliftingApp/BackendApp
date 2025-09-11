import { IsBoolean, IsMongoId, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class SubmitExerciseFeedbackDto {
  @IsNotEmpty()
  @IsMongoId()
  planId: string;

  @IsNotEmpty()
  @IsString()
  sessionId: string; // índice o id lógico de sesión

  @IsNotEmpty()
  @IsString()
  exerciseId: string; // índice o id lógico de ejercicio

  @IsOptional()
  @IsBoolean()
  completed?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  performanceComment?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  athleteNotes?: string;
}


