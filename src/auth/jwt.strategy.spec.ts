import { Test, TestingModule } from '@nestjs/testing';
import { JwtStrategy } from './jwt.strategy';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { UnauthorizedException } from '@nestjs/common';
import { UserStatus } from '../users/schemas/user.schema';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let usersService: UsersService;
  let configService: ConfigService;

  const mockUser = {
    _id: '507f1f77bcf86cd799439011',
    email: 'test@example.com',
    fullName: 'Test User',
    role: 'coach',
    status: UserStatus.ACTIVE,
    coachId: null,
  };

  const mockUsersService = {
    findByEmail: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    mockConfigService.get.mockReturnValue('test-secret');

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
    usersService = module.get<UsersService>(UsersService);
    configService = module.get<ConfigService>(ConfigService);

    // Resetear mocks antes de cada prueba
    jest.clearAllMocks();
  });

  describe('Definición de la estrategia', () => {
    it('debe estar definida la estrategia JWT', () => {
      expect(strategy).toBeDefined();
    });
  });

  describe('validate', () => {
    const mockPayload = {
      email: 'test@example.com',
      sub: '507f1f77bcf86cd799439011',
      role: 'coach',
      coachId: null,
    };

    it('debe validar y retornar datos del usuario con token válido', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);

      const result = await strategy.validate(mockPayload);

      expect(result).toEqual({
        userId: mockPayload.sub,
        email: mockPayload.email,
        role: mockPayload.role,
        coachId: mockPayload.coachId,
      });
      expect(usersService.findByEmail).toHaveBeenCalledWith(mockPayload.email);
    });

    it('debe lanzar UnauthorizedException si el usuario no existe', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);

      await expect(strategy.validate(mockPayload)).rejects.toThrow(
        new UnauthorizedException('Cuenta no activada o inválida'),
      );

      expect(usersService.findByEmail).toHaveBeenCalledWith(mockPayload.email);
    });

    it('debe lanzar UnauthorizedException si el usuario no está activo', async () => {
      const inactiveUser = { ...mockUser, status: UserStatus.PENDING };
      mockUsersService.findByEmail.mockResolvedValue(inactiveUser);

      await expect(strategy.validate(mockPayload)).rejects.toThrow(
        new UnauthorizedException('Cuenta no activada o inválida'),
      );

      expect(usersService.findByEmail).toHaveBeenCalledWith(mockPayload.email);
    });

    it('debe manejar usuarios con estado INACTIVE', async () => {
      const inactiveUser = { ...mockUser, status: UserStatus.PENDING };
      mockUsersService.findByEmail.mockResolvedValue(inactiveUser);

      await expect(strategy.validate(mockPayload)).rejects.toThrow(
        new UnauthorizedException('Cuenta no activada o inválida'),
      );
    });

    it('debe validar correctamente un usuario atleta', async () => {
      const athleteUser = {
        ...mockUser,
        role: 'athlete',
        coachId: '507f1f77bcf86cd799439022',
      };

      const athletePayload = {
        email: athleteUser.email,
        sub: athleteUser._id,
        role: athleteUser.role,
        coachId: athleteUser.coachId,
      };

      mockUsersService.findByEmail.mockResolvedValue(athleteUser);

      const result = await strategy.validate(athletePayload);

      expect(result).toEqual({
        userId: athletePayload.sub,
        email: athletePayload.email,
        role: athletePayload.role,
        coachId: athletePayload.coachId,
      });
      expect(result.coachId).toBe(athleteUser.coachId);
    });

    it('debe extraer correctamente el userId del campo sub', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);

      const result = await strategy.validate(mockPayload);

      expect(result.userId).toBe(mockPayload.sub);
    });

    it('debe retornar todos los campos esperados en el resultado', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);

      const result = await strategy.validate(mockPayload);

      expect(result).toHaveProperty('userId');
      expect(result).toHaveProperty('email');
      expect(result).toHaveProperty('role');
      expect(result).toHaveProperty('coachId');
    });
  });
});
