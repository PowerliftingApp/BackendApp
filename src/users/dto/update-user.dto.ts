import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'El nombre debe tener al menos 2 caracteres' })
  fullName?: string;

  @IsOptional()
  @IsEmail({}, { message: 'El correo electrónico debe tener un formato válido' })
  email?: string;
}


