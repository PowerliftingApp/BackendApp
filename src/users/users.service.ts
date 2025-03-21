import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { User, UserDocument, UserRole, UserStatus } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import * as crypto from 'crypto';
import { MailService } from '../mail/mail.service';

// Función auxiliar para generar ID de entrenador
function generateCoachId(): string {
  return 'COACH-' + Math.random().toString(36).substring(2, 8).toUpperCase();
}

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private mailService: MailService,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<UserDocument> {
    // Verificar si el correo ya está en uso
    const existingUser = await this.userModel.findOne({ email: createUserDto.email });
    if (existingUser) {
      throw new ConflictException('El correo electrónico ya está en uso');
    }

    // Crear una nueva instancia de usuario con los datos básicos
    const userData = {
      fullName: createUserDto.fullName,
      email: createUserDto.email,
      password: createUserDto.password,
      role: createUserDto.role,
      // No incluimos coachId aquí porque depende del rol
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
    
    // Si el usuario es atleta y proporcionó un ID de entrenador, verificar y establecer relación
    if (createUserDto.role === UserRole.ATHLETE && createUserDto.coach) {
      const coach = await this.userModel.findOne({ 
        coachId: createUserDto.coach, 
        role: UserRole.COACH 
      });
      
      if (!coach) {
        throw new NotFoundException('El ID de entrenador proporcionado no existe');
      }
      
      // Establecer la referencia al entrenador
      newUser.coach = coach.coachId as string;
      
      // Guardamos el usuario para obtener su ID
      await newUser.save();
      
    } else {
      // Si no hay relación con un entrenador, simplemente guardamos el usuario
      await newUser.save();
    }

    // Enviar correo de activación
    // await this.mailService.sendActivationEmail(
    //   newUser.email,
    //   newUser.fullName,
    //   activationToken
    // );

    return newUser;
  }

  async activateAccount(token: string): Promise<void> {
    const user = await this.userModel.findOne({ activationToken: token });
    if (!user) {
      throw new BadRequestException('Token de activación inválido');
    }

    user.status = UserStatus.ACTIVE;
    user.activationToken = "";
    await user.save();
  }

  async findByEmail(email: string): Promise<UserDocument> {
    const user = await this.userModel.findOne({ email });
    if (!user) {
      throw new NotFoundException('User not found');
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
    const athlete = await this.userModel.findById(athleteId).populate('coach');
    if (!athlete || !athlete.coach) {
      return null;
    }
    
    // Acceder al coachId a través de la referencia poblada
    return (athlete.coach as any).coachId;
  }
}