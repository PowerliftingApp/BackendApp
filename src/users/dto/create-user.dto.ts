import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, Matches, MinLength } from 'class-validator';
import { UserRole } from '../schemas/user.schema';

export class CreateUserDto {
  @IsNotEmpty()
  @IsString()
  fullName: string;

  @IsNotEmpty()
  @IsEmail({}, { message: 'El correo electrónico debe tener un formato válido' })
  email: string;

  @IsNotEmpty()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  @Matches(/^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])/, {
    message: 'La contraseña debe incluir al menos una mayúscula, un número y un carácter especial',
  })
  password: string;

  @IsNotEmpty()
  @IsEnum(UserRole, { message: 'El rol debe ser atleta o entrenador' })
  role: UserRole;

  @IsOptional()
  @IsString()
  coachId?: string; // Para atletas: ID del entrenador al que vincularse (no se guardará como propiedad del atleta)
}