import {
  Controller,
  Post,
  Body,
  Param,
  Get,
  UseGuards,
  Req,
  Delete,
  Put,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { UpdateUserDto } from './dto/update-user.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import * as multer from 'multer';
import * as path from 'path';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('register')
  async create(@Body() createUserDto: CreateUserDto) {
    const user = await this.usersService.create(createUserDto);
    return {
      message:
        'Usuario registrado correctamente. Por favor, revisa tu correo para activar la cuenta.',
      user: {
        id: user._id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        coachId: user.coachId,
        coach: user.coach,
      },
    };
  }

  @Get('get-userid/:email')
  async getUserId(@Param('email') email: string) {
    const athleteId = await this.usersService.getAthleteId(email);
    return { athleteId };
  }

  @Get('activate/:token')
  async activateAccount(@Param('token') token: string) {
    await this.usersService.activateAccount(token);
    return {
      message: 'Cuenta activada correctamente. Ahora puedes iniciar sesión.',
    };
  }

  @Get('coach/:coachId')
  async validateCoachId(@Param('coachId') coachId: string) {
    const coach = await this.usersService.findByCoachId(coachId);
    return { valid: !!coach };
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Req() req) {
    return req.user;
  }

  // Obtener info básica del coach asignado a un atleta (autenticado)
  @UseGuards(JwtAuthGuard)
  @Get('me/coach')
  async getMyCoach(@Req() req) {
    if (req.user.role !== 'athlete') {
      throw new Error('Solo los atletas pueden consultar su entrenador');
    }
    const coachId = await this.usersService.getCoachIdForAthlete(req.user.userId);
    if (!coachId) {
      return { coach: null };
    }
    const coach = await this.usersService.findByCoachId(coachId);
    return {
      coach: {
        _id: coach._id,
        fullName: coach.fullName,
        email: coach.email,
        coachId: coach.coachId,
      }
    };
  }

  @UseGuards(JwtAuthGuard)
  @Put('profile')
  async updateProfile(@Req() req, @Body() updateUserDto: UpdateUserDto) {
    const updated = await this.usersService.updateProfile(req.user.userId, updateUserDto);
    return {
      message: 'Perfil actualizado correctamente',
      user: {
        id: updated._id,
        email: updated.email,
        fullName: updated.fullName,
        role: updated.role,
        coachId: updated.coachId,
        coach: updated.coach,
        profilePicture: updated.profilePicture,
      },
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('profile-picture')
  @UseInterceptors(FileInterceptor('profilePicture', {
    storage: multer.diskStorage({
      destination: path.join(process.cwd(), 'uploads'),
      filename: (_req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = file.originalname.split('.').pop();
        cb(null, `profile-${uniqueSuffix}.${ext}`);
      },
    }),
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB para fotos de perfil
    },
    fileFilter: (_req, file, cb) => {
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Solo se permiten archivos de imagen'), false);
      }
    },
  }))
  async updateProfilePicture(
    @UploadedFile() file: any,
    @Req() req,
  ) {
    const profilePictureUrl = file ? `/uploads/${file.filename}` : undefined;
    const updated = await this.usersService.updateProfilePicture(req.user.userId, profilePictureUrl);
    return {
      message: 'Foto de perfil actualizada correctamente',
      user: {
        id: updated._id,
        email: updated.email,
        fullName: updated.fullName,
        role: updated.role,
        coachId: updated.coachId,
        coach: updated.coach,
        profilePicture: updated.profilePicture,
      },
    };
  }

  @Post('recover-password')
  async requestPasswordRecovery(@Body('email') email: string) {
    await this.usersService.requestPasswordRecovery(email);
    return {
      message:
        'Se ha enviado un correo con las instrucciones para recuperar tu contraseña',
    };
  }

  @Post('reset-password')
  async resetPassword(
    @Body('token') token: string,
    @Body('newPassword') newPassword: string,
  ) {
    await this.usersService.resetPassword(token, newPassword);
    return {
      message: 'Contraseña restablecida correctamente',
    };
  }

  @Get('athletes/:coachId')
  async getAthletes(@Param('coachId') coachId: string) {
    const user = await this.usersService.getAthletes(coachId);

    const athletes = user.map((user) => {
      return {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        coachId: user.coachId,
        coach: user.coach,
        joinDate: (user as any).createdAt,
        status: (user as any).status,
      };
    });

    return athletes;
  }

  @UseGuards(JwtAuthGuard)
  @Get('dashboard/:coachId')
  async getDashboardData(@Param('coachId') coachId: string, @Req() req) {
    // Solo el coach dueño puede consultar su dashboard
    if (req.user.role !== 'coach' || req.user.coachId !== coachId) {
      throw new Error('No autorizado');
    }

    const coach = await this.usersService.findByCoachId(coachId);
    if (!coach) {
      throw new Error('Coach no encontrado');
    }

    const athletes = await this.usersService.getAthletes(coachId);

    const totalAthletes = athletes.length;
    const activeAthletes = athletes.filter((a: any) => a.status === 'active').length;

    // Top 5 atletas recientes con progreso básico (puede refinarse luego)
    const athletesWithProgress = athletes.slice(0, 5).map((athlete: any) => {
      const joinDate = (athlete as any).createdAt || new Date();
      const daysSinceJoin = Math.floor((Date.now() - new Date(joinDate).getTime()) / (1000 * 60 * 60 * 24));
      const progress = Math.min(Math.max(Math.floor((daysSinceJoin / 30) * 10), 0), 100);
      return {
        _id: athlete._id,
        fullName: athlete.fullName,
        email: athlete.email,
        joinDate,
        status: athlete.status,
        progress,
      };
    });

    return {
      summary: {
        totalAthletes,
        activeAthletes,
        inactiveAthletes: Math.max(totalAthletes - activeAthletes, 0),
      },
      athletes: athletesWithProgress,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('athlete/:athleteId')
  async getAthleteDetails(@Param('athleteId') athleteId: string, @Req() req) {
    // Solo coaches pueden ver detalles de atletas
    if (req.user.role !== 'coach') {
      throw new Error('Solo los entrenadores pueden ver detalles de atletas');
    }
    
    const athleteDetails = await this.usersService.getAthleteDetails(athleteId, req.user.userId);
    return athleteDetails;
  }

  @UseGuards(JwtAuthGuard)
  @Get('search/:email')
  async searchAthleteByEmail(@Param('email') email: string, @Req() req) {
    // Solo coaches pueden buscar atletas
    if (req.user.role !== 'coach') {
      throw new Error('Solo los entrenadores pueden buscar atletas');
    }
    
    const athlete = await this.usersService.findAthleteByEmail(email);
    if (!athlete) {
      return { found: false, message: 'Atleta no encontrado' };
    }
    
    return {
      found: true,
      athlete: {
        _id: athlete._id,
        fullName: athlete.fullName,
        email: athlete.email,
        role: athlete.role,
        coach: athlete.coach,
        hasCoach: !!athlete.coach,
      },
    };
  }

  @UseGuards(JwtAuthGuard)
  @Put('athletes/:athleteId/link-coach')
  async linkCoach(
    @Param('athleteId') athleteId: string,
    @Req() req,
  ) {
    // Solo coaches pueden vincular atletas
    if (req.user.role !== 'coach') {
      throw new Error('Solo los entrenadores pueden vincular atletas');
    }
    
    const updated = await this.usersService.linkCoachToAthlete(
      athleteId,
      req.user.userId,
    );
    
    return {
      message: 'Atleta vinculado correctamente',
      athlete: {
        _id: updated._id,
        fullName: updated.fullName,
        email: updated.email,
        role: updated.role,
        coach: updated.coach,
      },
    };
  }

  @UseGuards(JwtAuthGuard)
  @Delete('athletes/:athleteId/coach')
  async unlinkCoach(
    @Param('athleteId') athleteId: string,
    @Req() req,
  ) {
    const requester = {
      userId: req.user.userId,
      role: req.user.role,
    };
    const updated = await this.usersService.unlinkCoachFromAthlete(
      athleteId,
      requester,
    );
    return {
      message: 'Entrenador desvinculado correctamente',
      athlete: {
        _id: updated._id,
        fullName: updated.fullName,
        email: updated.email,
        role: updated.role,
        coach: updated.coach ?? null,
      },
    };
  }
}
