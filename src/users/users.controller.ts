import { Controller, Post, Body, Param, Get, UseGuards, Req } from '@nestjs/common';
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
}
