import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import * as bcrypt from 'bcrypt';

export enum UserRole {
  ATHLETE = 'athlete',
  COACH = 'coach',
}

export enum UserStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
}

// Interfaz para los métodos de documento
export interface UserMethods {
  comparePassword(password: string): Promise<boolean>;
}

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true })
  fullName: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true, enum: UserRole })
  role: UserRole;

  @Prop({ enum: UserStatus, default: UserStatus.PENDING })
  status: UserStatus;

  // Solo para entrenadores: ID único que pueden usar los atletas para conectarse
  @Prop({ 
    required: false, 
    unique: true, 
    sparse: true,
    // Añadimos este validador para asegurarnos de que solo los entrenadores tengan coachId
    validate: {
      validator: function(this: User) {
        return this.role === UserRole.COACH;
      },
      message: 'Solo los entrenadores pueden tener un coachId'
    }
  })
  coachId?: string;

  // Solo para atletas: referencia a su entrenador
  @Prop({
    ref: 'User',
    sparse: true,
    required: false,
    // Añadimos este validador para asegurarnos de que solo los atletas tengan coach
    validate: {
      validator: function(this: User) {
        return this.role === UserRole.ATHLETE;
      },
      message: 'Solo los atletas pueden tener un entrenador asignado'
    }
  })
  coach?: string;

  @Prop()
  activationToken?: string;

  @Prop()
  passwordRecoveryToken?: string;

  @Prop()
  passwordRecoveryExpires?: Date;

  // Foto de perfil opcional para ambos roles
  @Prop({ required: false })
  profilePicture?: string;
}

export type UserDocument = User & Document & UserMethods;
export const UserSchema = SchemaFactory.createForClass(User);

// Middleware para encriptar contraseña antes de guardar
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt();
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Método para comparar contraseñas
UserSchema.methods.comparePassword = async function(password: string): Promise<boolean> {
  return bcrypt.compare(password, this.password);
};

// Método estático para generar ID de entrenador
UserSchema.statics.generateCoachId = function(): string {
  return 'COACH-' + Math.random().toString(36).substring(2, 8).toUpperCase();
};