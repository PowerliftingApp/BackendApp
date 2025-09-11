import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, Matches, MinLength, ValidateIf, registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';
import { UserRole } from '../schemas/user.schema';

// Custom validator para verificar consistencia de roles
function IsRoleConsistent(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isRoleConsistent',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          const obj = args.object as CreateUserDto;
          
          // Si es coach, no puede tener campo 'coach'
          if (obj.role === UserRole.COACH && obj.coach) {
            return false;
          }
          
          // Si es atleta, no puede tener campo 'coachId' enviado desde frontend
          if (obj.role === UserRole.ATHLETE && obj.coachId) {
            return false;
          }
          
          return true;
        },
        defaultMessage(args: ValidationArguments) {
          const obj = args.object as CreateUserDto;
          if (obj.role === UserRole.COACH && obj.coach) {
            return 'Un entrenador no puede tener un entrenador asignado';
          }
          if (obj.role === UserRole.ATHLETE && obj.coachId) {
            return 'Un atleta no puede tener un coachId propio';
          }
          return 'Configuración de rol inconsistente';
        },
      },
    });
  };
}

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
  @IsRoleConsistent()
  role: UserRole;

  // Solo debe estar presente cuando el rol es ATHLETE
  @ValidateIf(o => o.role === UserRole.ATHLETE)
  @IsOptional()
  @IsString()
  coach?: string; // Para atletas: ID del entrenador al que vincularse

  // Este campo no debería venir del frontend, se genera automáticamente para coaches
  @ValidateIf(o => false) // Nunca validar este campo desde el frontend
  coachId?: string; 

}