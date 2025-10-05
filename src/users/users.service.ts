import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import {
  User,
  UserDocument,
  UserRole,
  UserStatus,
} from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import * as crypto from 'crypto';
import { MailService } from '../mail/mail.service';
import { TrainingPlansService } from '../training-plans/training-plans.service';

// Función auxiliar para generar ID de entrenador
function generateCoachId(): string {
  return 'COACH-' + Math.random().toString(36).substring(2, 8).toUpperCase();
}

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private mailService: MailService,
    private trainingPlansService: TrainingPlansService,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<UserDocument> {
    // Verificar si el correo ya está en uso
    const existingUser = await this.userModel.findOne({
      email: createUserDto.email,
    });
    if (existingUser) {
      throw new ConflictException('El correo electrónico ya está en uso');
    }

    // Validar que un usuario no intente registrarse con datos de ambos roles
    if (createUserDto.role === UserRole.COACH && createUserDto.coach) {
      throw new BadRequestException('Un entrenador no puede tener un entrenador asignado');
    }

    if (createUserDto.role === UserRole.ATHLETE && createUserDto.coachId) {
      throw new BadRequestException('Un atleta no puede tener un coachId propio');
    }


    // Crear una nueva instancia de usuario con los datos básicos
    const userData = {
      fullName: createUserDto.fullName,
      email: createUserDto.email,
      password: createUserDto.password,
      role: createUserDto.role,
      // No incluimos coachId aquí porque depende del rol
      status: UserStatus.ACTIVE, // Activar por defecto
    };

    const newUser = new this.userModel(userData);

    // Generar token de activación
    const activationToken = crypto.randomBytes(32).toString('hex');
    newUser.activationToken = activationToken;

    // Si el usuario es entrenador, generar ID único
    if (createUserDto.role === UserRole.COACH) {
      // Usamos el método estático para generar el coachId
      newUser.coachId = generateCoachId();
    }

    // Enviar correo de activación
    // await this.mailService.sendActivationEmail(
    //   newUser.email,
    //   newUser.fullName,
    //   activationToken
    // );

    // Si el usuario es atleta y proporcionó un ID de entrenador, verificar y establecer relación
    if (createUserDto.role === UserRole.ATHLETE && createUserDto.coach) {
      const coach = await this.userModel.findOne({
        coachId: createUserDto.coach,
        role: UserRole.COACH,
      });

      if (!coach) {
        throw new NotFoundException(
          'El ID de entrenador proporcionado no existe',
        );
      }

      // Establecer la referencia al entrenador
      newUser.coach = coach.coachId as string;

      // Guardamos el usuario para obtener su ID
      await newUser.save();
    } else {
      // Si no hay relación con un entrenador, simplemente guardamos el usuario
      await newUser.save();
    }

    return newUser;
  }

  async updateProfile(
    userId: string,
    update: { fullName?: string; email?: string },
  ): Promise<UserDocument> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new ForbiddenException('La cuenta debe estar activa para actualizar el perfil');
    }

    // Restringir cambios de campos sensibles (role, coachId, coach, status, password)
    const { fullName, email } = update;

    if (email && email !== user.email) {
      // Verificar unicidad de email
      const emailInUse = await this.userModel.findOne({ email });
      if (emailInUse && emailInUse.id !== user.id) {
        throw new ConflictException('El correo electrónico ya está en uso');
      }
      user.email = email;
    }

    if (typeof fullName === 'string' && fullName.trim().length > 0) {
      user.fullName = fullName.trim();
    }

    await user.save();

    return user;
  }

  async updateProfilePicture(
    userId: string,
    profilePictureUrl: string | undefined,
  ): Promise<UserDocument> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new ForbiddenException('La cuenta debe estar activa para actualizar la foto de perfil');
    }

    user.profilePicture = profilePictureUrl;
    await user.save();

    return user;
  }

  async activateAccount(token: string): Promise<void> {
    const user = await this.userModel.findOne({ activationToken: token });
    if (!user) {
      throw new BadRequestException('Token de activación inválido');
    }

    user.status = UserStatus.ACTIVE;
    user.activationToken = '';
    await user.save();
  }

  async findByEmail(email: string): Promise<UserDocument> {
    const user = await this.userModel.findOne({ email });
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }
    return user;
  }

  async findByCoachId(coachId: string): Promise<UserDocument> {
    const coach = await this.userModel.findOne({ coachId });
    if (!coach) {
      throw new NotFoundException('Coach not found');
    }
    return coach;
  }

  // Método para obtener el ID de entrenador de un atleta
  async getCoachIdForAthlete(athleteId: string): Promise<string | null> {
    const athlete = await this.userModel.findById(athleteId).lean();
    if (!athlete || !athlete.coach) {
      return null;
    }
    // En este modelo, el campo `coach` almacena el coachId (string)
    return (athlete as any).coach as string;
  }

  async requestPasswordRecovery(email: string): Promise<void> {
    const user = await this.userModel.findOne({ email });
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const recoveryToken = crypto.randomBytes(32).toString('hex');
    user.passwordRecoveryToken = recoveryToken;
    user.passwordRecoveryExpires = new Date(Date.now() + 3600000); // 1 hora
    await user.save();

    await this.mailService.sendPasswordRecoveryEmail(
      user.email,
      user.fullName,
      recoveryToken,
    );
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const user = await this.userModel.findOne({
      passwordRecoveryToken: token,
      passwordRecoveryExpires: { $gt: Date.now() },
    });

    if (!user) {
      throw new BadRequestException('Token inválido o expirado');
    }

    user.password = newPassword;
    user.passwordRecoveryToken = undefined;
    user.passwordRecoveryExpires = undefined;
    await user.save();
  }

  async getAthletes(coachId: string): Promise<UserDocument[]> {
    return this.userModel.find({ coach: coachId, role: UserRole.ATHLETE }).exec();
  }

  async getAthleteDetails(athleteId: string, coachUserId: string): Promise<any> {
    // Buscar al atleta
    const athlete = await this.userModel.findById(athleteId);
    if (!athlete) {
      throw new NotFoundException('Atleta no encontrado');
    }

    if (athlete.role !== UserRole.ATHLETE) {
      throw new BadRequestException('El usuario indicado no es un atleta');
    }

    // Verificar que el coach tenga permisos para ver este atleta
    const coach = await this.userModel.findById(coachUserId);
    if (!coach || coach.role !== UserRole.COACH) {
      throw new ForbiddenException('No autorizado');
    }

    if (athlete.coach !== coach.coachId) {
      throw new ForbiddenException('Solo puedes ver detalles de tus propios atletas');
    }

    // Calcular estadísticas reales
    const joinDate = (athlete as any).createdAt || new Date();
    const daysSinceJoin = Math.floor((Date.now() - joinDate.getTime()) / (1000 * 60 * 60 * 24));

    const plans = await this.trainingPlansService.findByAthleteId(athlete.id);
    const totalTrainingPlans = plans.length;
    const activePlans = plans.filter((p: any) => Array.isArray(p.sessions) && p.sessions.some((s: any) => !s.completed)).length;
    let completedSessions = 0;
    plans.forEach((p: any) => {
      (p.sessions || []).forEach((s: any) => { if (s.completed) completedSessions++; });
    });

    return {
      _id: athlete._id,
      fullName: athlete.fullName,
      email: athlete.email,
      role: athlete.role,
      status: athlete.status,
      coach: athlete.coach,
      profilePicture: athlete.profilePicture,
      joinDate: joinDate,
      daysSinceJoin,
      stats: {
        totalTrainingPlans,
        activePlans,
        completedSessions,
      }
    };
  }

  async getAthleteId(email: string): Promise<string> {
    const athlete = await this.userModel.findOne({ email, role: UserRole.ATHLETE });
    if (!athlete) {
      throw new NotFoundException('Atleta no encontrado');
    }
    return athlete._id as string;
  }

  async findAthleteByEmail(email: string): Promise<UserDocument | null> {
    const athlete = await this.userModel.findOne({ 
      email,
      role: UserRole.ATHLETE,
      status: UserStatus.ACTIVE 
    });
    return athlete;
  }

  async linkCoachToAthlete(
    athleteId: string,
    coachUserId: string,
  ): Promise<UserDocument> {
    // Buscar al atleta
    const athlete = await this.userModel.findById(athleteId);
    if (!athlete) {
      throw new NotFoundException('Atleta no encontrado');
    }

    if (athlete.role !== UserRole.ATHLETE) {
      throw new BadRequestException('El usuario indicado no es un atleta');
    }

    if (athlete.status !== UserStatus.ACTIVE) {
      throw new BadRequestException('El atleta debe tener una cuenta activa');
    }

    if (athlete.coach) {
      throw new BadRequestException('El atleta ya tiene un entrenador asignado');
    }

    // Buscar al coach
    const coach = await this.userModel.findById(coachUserId);
    if (!coach || coach.role !== UserRole.COACH) {
      throw new NotFoundException('Entrenador no encontrado');
    }

    if (coach.status !== UserStatus.ACTIVE) {
      throw new BadRequestException('El entrenador debe tener una cuenta activa');
    }

    if (!coach.coachId) {
      throw new BadRequestException('El entrenador no tiene un ID de entrenador válido');
    }

    // Vincular el atleta al coach
    athlete.coach = coach.coachId;
    await athlete.save();
    return athlete;
  }

  async unlinkCoachFromAthlete(
    athleteId: string,
    requester: { userId: string; role: UserRole },
  ): Promise<UserDocument> {
    const athlete = await this.userModel.findById(athleteId);
    if (!athlete) {
      throw new NotFoundException('Atleta no encontrado');
    }

    if (athlete.role !== UserRole.ATHLETE) {
      throw new BadRequestException('El usuario indicado no es un atleta');
    }

    if (!athlete.coach) {
      throw new BadRequestException('El atleta no tiene entrenador asignado');
    }

    if (requester.role === UserRole.ATHLETE) {
      if (athlete.id !== requester.userId) {
        throw new ForbiddenException('No autorizado para desvincular a este atleta');
      }
    } else if (requester.role === UserRole.COACH) {
      const coach = await this.userModel.findById(requester.userId);
      if (!coach || coach.role !== UserRole.COACH) {
        throw new ForbiddenException('No autorizado');
      }
      if (athlete.coach !== coach.coachId) {
        throw new ForbiddenException('Solo el entrenador asignado puede desvincular a este atleta');
      }
    } else {
      throw new ForbiddenException('Rol no autorizado');
    }

    athlete.coach = undefined;
    await athlete.save();
    return athlete;
  }
}
