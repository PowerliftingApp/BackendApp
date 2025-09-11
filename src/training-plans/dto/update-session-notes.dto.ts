import { IsMongoId, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateSessionNotesDto {
  @IsNotEmpty()
  @IsMongoId()
  planId: string;

  @IsNotEmpty()
  @IsString()
  sessionId: string; // índice o id lógico de sesión

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  sessionNotes?: string;
}


