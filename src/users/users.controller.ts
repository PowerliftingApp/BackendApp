import {
  Controller,
  Post,
  Body,
  Param,
  Get,
  UseGuards,
  Req,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

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
      };
    });

    return athletes;
  }
}
