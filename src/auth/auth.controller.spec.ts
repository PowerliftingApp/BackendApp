import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UnauthorizedException } from '@nestjs/common';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockUser = {
    _id: '507f1f77bcf86cd799439011',
    email: 'test@example.com',
    fullName: 'Test User',
    role: 'coach',
    status: 'active',
    coachId: null,
  };

  const mockAuthService = {
    validateUser: jest.fn(),
    login: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);

    // Resetear mocks antes de cada prueba
    jest.clearAllMocks();
  });

  describe('Definición del controlador', () => {
    it('debe estar definido el controlador', () => {
      expect(controller).toBeDefined();
    });
  });

  describe('POST /auth/login', () => {
    const loginDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('debe iniciar sesión exitosamente con credenciales válidas', async () => {
      const mockResponse = {
        access_token: 'mock.jwt.token',
        user: {
          id: mockUser._id,
          email: mockUser.email,
          fullName: mockUser.fullName,
          role: mockUser.role,
          coachId: mockUser.coachId,
        },
      };

      mockAuthService.validateUser.mockResolvedValue(mockUser);
      mockAuthService.login.mockResolvedValue(mockResponse);

      const result = await controller.login(loginDto);

      expect(result).toEqual(mockResponse);
      expect(authService.validateUser).toHaveBeenCalledWith(
        loginDto.email,
        loginDto.password,
      );
      expect(authService.login).toHaveBeenCalledWith(mockUser);
    });

    it('debe lanzar UnauthorizedException con credenciales inválidas', async () => {
      mockAuthService.validateUser.mockRejectedValue(
        new UnauthorizedException('Credenciales inválidas'),
      );

      await expect(controller.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );

      expect(authService.validateUser).toHaveBeenCalledWith(
        loginDto.email,
        loginDto.password,
      );
      expect(authService.login).not.toHaveBeenCalled();
    });

    it('debe lanzar UnauthorizedException cuando el usuario no está activo', async () => {
      mockAuthService.validateUser.mockRejectedValue(
        new UnauthorizedException('Por favor, activa tu cuenta primero. Revisa tu correo electrónico.'),
      );

      await expect(controller.login(loginDto)).rejects.toThrow(
        new UnauthorizedException('Por favor, activa tu cuenta primero. Revisa tu correo electrónico.'),
      );

      expect(authService.validateUser).toHaveBeenCalledWith(
        loginDto.email,
        loginDto.password,
      );
    });

    it('debe manejar usuarios atletas correctamente', async () => {
      const athleteUser = {
        ...mockUser,
        role: 'athlete',
        coachId: '507f1f77bcf86cd799439022',
      };

      const mockResponse = {
        access_token: 'mock.jwt.token.athlete',
        user: {
          id: athleteUser._id,
          email: athleteUser.email,
          fullName: athleteUser.fullName,
          role: athleteUser.role,
          coachId: athleteUser.coachId,
        },
      };

      mockAuthService.validateUser.mockResolvedValue(athleteUser);
      mockAuthService.login.mockResolvedValue(mockResponse);

      const result = await controller.login(loginDto);

      expect(result).toEqual(mockResponse);
      expect(result.user.coachId).toBe(athleteUser.coachId);
    });

    it('debe propagar el mensaje de error correctamente', async () => {
      const errorMessage = 'Error específico de autenticación';
      mockAuthService.validateUser.mockRejectedValue({
        message: errorMessage,
      });

      await expect(controller.login(loginDto)).rejects.toThrow(
        new UnauthorizedException(errorMessage),
      );
    });

    it('debe validar que el email se pasa correctamente', async () => {
      const customEmail = 'custom@example.com';
      const customDto = { email: customEmail, password: 'pass123' };

      mockAuthService.validateUser.mockResolvedValue(mockUser);
      mockAuthService.login.mockResolvedValue({ access_token: 'token', user: mockUser });

      await controller.login(customDto);

      expect(authService.validateUser).toHaveBeenCalledWith(customEmail, 'pass123');
    });
  });
});
