import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { UnauthorizedException } from '@nestjs/common';
import { UserStatus } from '../users/schemas/user.schema';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: UsersService;
  let jwtService: JwtService;

  const mockUser = {
    _id: '507f1f77bcf86cd799439011',
    email: 'test@example.com',
    fullName: 'Test User',
    role: 'coach',
    status: UserStatus.ACTIVE,
    coachId: null,
    comparePassword: jest.fn(),
  };

  const mockUsersService = {
    findByEmail: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);

    // Resetear mocks antes de cada prueba
    jest.clearAllMocks();
  });

  describe('Definición del servicio', () => {
    it('debe estar definido el servicio', () => {
      expect(service).toBeDefined();
    });
  });

  describe('validateUser', () => {
    it('debe validar usuario con credenciales correctas', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      mockUser.comparePassword.mockResolvedValue(true);

      const result = await service.validateUser('test@example.com', 'password123');

      expect(result).toEqual(mockUser);
      expect(usersService.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(mockUser.comparePassword).toHaveBeenCalledWith('password123');
    });

    it('debe lanzar UnauthorizedException cuando el usuario no existe', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);

      await expect(
        service.validateUser('noexiste@example.com', 'password123'),
      ).rejects.toThrow(new UnauthorizedException('Credenciales inválidas'));

      expect(usersService.findByEmail).toHaveBeenCalledWith('noexiste@example.com');
    });

    it('debe lanzar UnauthorizedException cuando el usuario no está activo', async () => {
      const inactiveUser = { ...mockUser, status: UserStatus.PENDING };
      mockUsersService.findByEmail.mockResolvedValue(inactiveUser);

      await expect(
        service.validateUser('test@example.com', 'password123'),
      ).rejects.toThrow(
        new UnauthorizedException('Por favor, activa tu cuenta primero. Revisa tu correo electrónico.'),
      );

      expect(usersService.findByEmail).toHaveBeenCalledWith('test@example.com');
    });

    it('debe lanzar UnauthorizedException cuando la contraseña es incorrecta', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      mockUser.comparePassword.mockResolvedValue(false);

      await expect(
        service.validateUser('test@example.com', 'wrongpassword'),
      ).rejects.toThrow(new UnauthorizedException('Credenciales inválidas'));

      expect(usersService.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(mockUser.comparePassword).toHaveBeenCalledWith('wrongpassword');
    });

    it('debe manejar usuarios con estado INACTIVE', async () => {
      const inactiveUser = { ...mockUser, status: UserStatus.PENDING };
      mockUsersService.findByEmail.mockResolvedValue(inactiveUser);

      await expect(
        service.validateUser('test@example.com', 'password123'),
      ).rejects.toThrow(
        new UnauthorizedException('Por favor, activa tu cuenta primero. Revisa tu correo electrónico.'),
      );
    });
  });

  describe('login', () => {
    it('debe generar token JWT y retornar datos del usuario', async () => {
      const mockToken = 'mock.jwt.token';
      mockJwtService.sign.mockReturnValue(mockToken);

      const result = await service.login(mockUser);

      expect(result).toEqual({
        access_token: mockToken,
        user: {
          id: mockUser._id,
          email: mockUser.email,
          fullName: mockUser.fullName,
          role: mockUser.role,
          coachId: mockUser.coachId,
        },
      });

      expect(jwtService.sign).toHaveBeenCalledWith({
        email: mockUser.email,
        sub: mockUser._id,
        role: mockUser.role,
        coachId: mockUser.coachId,
      });
    });

    it('debe generar token JWT para usuario atleta con coachId', async () => {
      const athleteUser = {
        ...mockUser,
        role: 'athlete',
        coachId: '507f1f77bcf86cd799439022',
      };
      const mockToken = 'mock.jwt.token.athlete';
      mockJwtService.sign.mockReturnValue(mockToken);

      const result = await service.login(athleteUser);

      expect(result).toEqual({
        access_token: mockToken,
        user: {
          id: athleteUser._id,
          email: athleteUser.email,
          fullName: athleteUser.fullName,
          role: athleteUser.role,
          coachId: athleteUser.coachId,
        },
      });

      expect(jwtService.sign).toHaveBeenCalledWith({
        email: athleteUser.email,
        sub: athleteUser._id,
        role: athleteUser.role,
        coachId: athleteUser.coachId,
      });
    });

    it('debe incluir todos los campos requeridos en el payload del JWT', async () => {
      mockJwtService.sign.mockReturnValue('token');

      await service.login(mockUser);

      const payload = mockJwtService.sign.mock.calls[0][0];
      expect(payload).toHaveProperty('email');
      expect(payload).toHaveProperty('sub');
      expect(payload).toHaveProperty('role');
      expect(payload).toHaveProperty('coachId');
    });
  });
});
