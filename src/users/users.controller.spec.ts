import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UserRole, UserStatus } from './schemas/user.schema';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ExecutionContext } from '@nestjs/common';

describe('UsersController', () => {
  let controller: UsersController;
  let service: UsersService;

  const mockUser = {
    _id: 'userId123',
    fullName: 'Test User',
    email: 'test@example.com',
    password: 'hashedPassword',
    role: UserRole.ATHLETE,
    status: UserStatus.ACTIVE,
    coach: 'COACH-ABC123',
    profilePicture: undefined,
    save: jest.fn(),
  };

  const mockCoach = {
    _id: 'coachId123',
    fullName: 'Test Coach',
    email: 'coach@example.com',
    password: 'hashedPassword',
    role: UserRole.COACH,
    status: UserStatus.ACTIVE,
    coachId: 'COACH-ABC123',
    profilePicture: undefined,
    save: jest.fn(),
  };

  const mockUsersService = {
    create: jest.fn(),
    activateAccount: jest.fn(),
    findByCoachId: jest.fn(),
    getCoachIdForAthlete: jest.fn(),
    updateProfile: jest.fn(),
    updateProfilePicture: jest.fn(),
    requestPasswordRecovery: jest.fn(),
    resetPassword: jest.fn(),
    getAthletes: jest.fn(),
    getAthleteDetails: jest.fn(),
    findAthleteByEmail: jest.fn(),
    linkCoachToAthlete: jest.fn(),
    unlinkCoachFromAthlete: jest.fn(),
    getAthleteId: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Definición del controlador', () => {
    it('should be defined', () => {
      expect(controller).toBeDefined();
    });
  });

  describe('POST /users/register - Registrar usuario', () => {
    it('debería registrar un nuevo usuario exitosamente', async () => {
      const createUserDto = {
        fullName: 'New User',
        email: 'newuser@example.com',
        password: 'Password123!',
        role: UserRole.ATHLETE,
      };

      const expectedUser = {
        _id: 'newUserId',
        ...createUserDto,
        status: UserStatus.PENDING,
      };

      mockUsersService.create.mockResolvedValue(expectedUser);

      const result = await controller.create(createUserDto);

      expect(result).toBeDefined();
      expect(result.message).toContain('Usuario registrado correctamente');
      expect(result.user).toBeDefined();
      expect(result.user.email).toBe(createUserDto.email);
      expect(mockUsersService.create).toHaveBeenCalledWith(createUserDto);
    });

    it('debería registrar un coach con coachId', async () => {
      const createUserDto = {
        fullName: 'New Coach',
        email: 'newcoach@example.com',
        password: 'Password123!',
        role: UserRole.COACH,
      };

      const expectedCoach = {
        _id: 'newCoachId',
        ...createUserDto,
        coachId: 'COACH-XYZ789',
        status: UserStatus.PENDING,
      };

      mockUsersService.create.mockResolvedValue(expectedCoach);

      const result = await controller.create(createUserDto);

      expect(result.user.coachId).toBeDefined();
      expect(result.user.coachId).toBe('COACH-XYZ789');
    });
  });

  describe('GET /users/activate/:token - Activar cuenta', () => {
    it('debería activar una cuenta con token válido', async () => {
      mockUsersService.activateAccount.mockResolvedValue(undefined);

      const result = await controller.activateAccount('validToken123');

      expect(result).toBeDefined();
      expect(result.message).toContain('Cuenta activada correctamente');
      expect(mockUsersService.activateAccount).toHaveBeenCalledWith(
        'validToken123',
      );
    });
  });

  describe('GET /users/coach/:coachId - Validar coachId', () => {
    it('debería retornar valid:true si el coachId existe', async () => {
      mockUsersService.findByCoachId.mockResolvedValue(mockCoach);

      const result = await controller.validateCoachId('COACH-ABC123');

      expect(result).toEqual({ valid: true });
      expect(mockUsersService.findByCoachId).toHaveBeenCalledWith(
        'COACH-ABC123',
      );
    });

    it('debería retornar valid:false si el coachId no existe', async () => {
      mockUsersService.findByCoachId.mockResolvedValue(null);

      const result = await controller.validateCoachId('COACH-INVALID');

      expect(result).toEqual({ valid: false });
    });
  });

  describe('GET /users/profile - Obtener perfil', () => {
    it('debería retornar el perfil del usuario autenticado', async () => {
      const req = { user: mockUser };

      const result = await controller.getProfile(req);

      expect(result).toBe(mockUser);
    });
  });

  describe('GET /users/me/coach - Obtener coach del atleta', () => {
    it('debería retornar el coach del atleta autenticado', async () => {
      const req = { user: { userId: 'athleteId', role: 'athlete' } };

      mockUsersService.getCoachIdForAthlete.mockResolvedValue('COACH-ABC123');
      mockUsersService.findByCoachId.mockResolvedValue(mockCoach);

      const result = await controller.getMyCoach(req);

      expect(result.coach).toBeDefined();
      expect(result.coach?.coachId).toBe('COACH-ABC123');
      expect(mockUsersService.getCoachIdForAthlete).toHaveBeenCalledWith(
        'athleteId',
      );
    });

    it('debería retornar null si el atleta no tiene coach', async () => {
      const req = { user: { userId: 'athleteId', role: 'athlete' } };

      mockUsersService.getCoachIdForAthlete.mockResolvedValue(null);

      const result = await controller.getMyCoach(req);

      expect(result.coach).toBeNull();
    });

    it('debería lanzar error si el usuario no es atleta', async () => {
      const req = { user: { userId: 'coachId', role: 'coach' } };

      await expect(controller.getMyCoach(req)).rejects.toThrow();
    });
  });

  describe('PUT /users/profile - Actualizar perfil', () => {
    it('debería actualizar el perfil del usuario', async () => {
      const req = { user: { userId: 'userId123' } };
      const updateUserDto = { fullName: 'Updated Name' };
      const updatedUser = { ...mockUser, fullName: 'Updated Name' };

      mockUsersService.updateProfile.mockResolvedValue(updatedUser);

      const result = await controller.updateProfile(req, updateUserDto);

      expect(result.message).toContain('Perfil actualizado correctamente');
      expect(result.user.fullName).toBe('Updated Name');
      expect(mockUsersService.updateProfile).toHaveBeenCalledWith(
        'userId123',
        updateUserDto,
      );
    });
  });

  describe('POST /users/profile-picture - Actualizar foto de perfil', () => {
    it('debería actualizar la foto de perfil', async () => {
      const req = { user: { userId: 'userId123' } };
      const file = { filename: 'profile-123.jpg' };
      const updatedUser = {
        ...mockUser,
        profilePicture: '/uploads/profile-123.jpg',
      };

      mockUsersService.updateProfilePicture.mockResolvedValue(updatedUser);

      const result = await controller.updateProfilePicture(file, req);

      expect(result.message).toContain(
        'Foto de perfil actualizada correctamente',
      );
      expect(result.user.profilePicture).toBe('/uploads/profile-123.jpg');
      expect(mockUsersService.updateProfilePicture).toHaveBeenCalledWith(
        'userId123',
        '/uploads/profile-123.jpg',
      );
    });

    it('debería permitir eliminar la foto de perfil', async () => {
      const req = { user: { userId: 'userId123' } };
      const file = undefined;
      const updatedUser = { ...mockUser, profilePicture: undefined };

      mockUsersService.updateProfilePicture.mockResolvedValue(updatedUser);

      const result = await controller.updateProfilePicture(file, req);

      expect(result.user.profilePicture).toBeUndefined();
      expect(mockUsersService.updateProfilePicture).toHaveBeenCalledWith(
        'userId123',
        undefined,
      );
    });
  });

  describe('POST /users/recover-password - Recuperar contraseña', () => {
    it('debería enviar email de recuperación', async () => {
      mockUsersService.requestPasswordRecovery.mockResolvedValue(undefined);

      const result = await controller.requestPasswordRecovery(
        'test@example.com',
      );

      expect(result.message).toContain(
        'Se ha enviado un correo con las instrucciones',
      );
      expect(mockUsersService.requestPasswordRecovery).toHaveBeenCalledWith(
        'test@example.com',
      );
    });
  });

  describe('POST /users/reset-password - Restablecer contraseña', () => {
    it('debería restablecer la contraseña', async () => {
      mockUsersService.resetPassword.mockResolvedValue(undefined);

      const result = await controller.resetPassword(
        'validToken',
        'NewPassword123!',
      );

      expect(result.message).toContain('Contraseña restablecida correctamente');
      expect(mockUsersService.resetPassword).toHaveBeenCalledWith(
        'validToken',
        'NewPassword123!',
      );
    });
  });

  describe('GET /users/athletes/:coachId - Obtener atletas', () => {
    it('debería retornar lista de atletas del coach', async () => {
      const athletes = [
        {
          _id: 'athlete1',
          fullName: 'Athlete 1',
          email: 'athlete1@example.com',
          role: UserRole.ATHLETE,
          coach: 'COACH-ABC123',
          createdAt: new Date(),
          status: UserStatus.ACTIVE,
          profilePicture: undefined,
        },
        {
          _id: 'athlete2',
          fullName: 'Athlete 2',
          email: 'athlete2@example.com',
          role: UserRole.ATHLETE,
          coach: 'COACH-ABC123',
          createdAt: new Date(),
          status: UserStatus.ACTIVE,
          profilePicture: undefined,
        },
      ];

      mockUsersService.getAthletes.mockResolvedValue(athletes);

      const result = await controller.getAthletes('COACH-ABC123');

      expect(result).toHaveLength(2);
      expect(result[0].fullName).toBe('Athlete 1');
      expect(mockUsersService.getAthletes).toHaveBeenCalledWith('COACH-ABC123');
    });
  });

  describe('GET /users/dashboard/:coachId - Dashboard del coach', () => {
    it('debería retornar datos del dashboard', async () => {
      const req = {
        user: { userId: 'coachId123', role: 'coach', coachId: 'COACH-ABC123' },
      };

      const athletes = [
        {
          _id: 'athlete1',
          fullName: 'Athlete 1',
          email: 'athlete1@example.com',
          role: UserRole.ATHLETE,
          coach: 'COACH-ABC123',
          createdAt: new Date(),
          status: 'active',
          profilePicture: undefined,
        },
        {
          _id: 'athlete2',
          fullName: 'Athlete 2',
          email: 'athlete2@example.com',
          role: UserRole.ATHLETE,
          coach: 'COACH-ABC123',
          createdAt: new Date(),
          status: 'active',
          profilePicture: undefined,
        },
      ];

      mockUsersService.findByCoachId.mockResolvedValue(mockCoach);
      mockUsersService.getAthletes.mockResolvedValue(athletes);

      const result = await controller.getDashboardData('COACH-ABC123', req);

      expect(result.summary).toBeDefined();
      expect(result.summary.totalAthletes).toBe(2);
      expect(result.summary.activeAthletes).toBe(2);
      expect(result.athletes).toBeDefined();
    });

    it('debería lanzar error si no es el propietario del dashboard', async () => {
      const req = {
        user: { userId: 'coachId123', role: 'coach', coachId: 'COACH-XYZ' },
      };

      await expect(
        controller.getDashboardData('COACH-ABC123', req),
      ).rejects.toThrow();
    });
  });

  describe('GET /users/athlete/:athleteId - Detalles del atleta', () => {
    it('debería retornar detalles del atleta', async () => {
      const req = { user: { userId: 'coachId123', role: 'coach' } };
      const athleteDetails = {
        _id: 'athleteId',
        fullName: 'Athlete Test',
        email: 'athlete@example.com',
        role: UserRole.ATHLETE,
        status: UserStatus.ACTIVE,
        coach: 'COACH-ABC123',
        stats: {
          totalTrainingPlans: 5,
          activePlans: 2,
          completedSessions: 10,
        },
      };

      mockUsersService.getAthleteDetails.mockResolvedValue(athleteDetails);

      const result = await controller.getAthleteDetails('athleteId', req);

      expect(result).toBeDefined();
      expect(result.fullName).toBe('Athlete Test');
      expect(result.stats).toBeDefined();
      expect(mockUsersService.getAthleteDetails).toHaveBeenCalledWith(
        'athleteId',
        'coachId123',
      );
    });

    it('debería lanzar error si no es coach', async () => {
      const req = { user: { userId: 'athleteId', role: 'athlete' } };

      await expect(
        controller.getAthleteDetails('athleteId', req),
      ).rejects.toThrow();
    });
  });

  describe('GET /users/search/:email - Buscar atleta por email', () => {
    it('debería encontrar un atleta por email', async () => {
      const req = { user: { userId: 'coachId123', role: 'coach' } };
      const athlete = {
        _id: 'athleteId',
        fullName: 'Athlete Test',
        email: 'athlete@example.com',
        role: UserRole.ATHLETE,
        coach: undefined,
      };

      mockUsersService.findAthleteByEmail.mockResolvedValue(athlete);

      const result = await controller.searchAthleteByEmail(
        'athlete@example.com',
        req,
      );

      expect(result.found).toBe(true);
      expect(result.athlete).toBeDefined();
      expect(result.athlete?.email).toBe('athlete@example.com');
      expect(result.athlete?.hasCoach).toBe(false);
    });

    it('debería retornar found:false si no encuentra el atleta', async () => {
      const req = { user: { userId: 'coachId123', role: 'coach' } };

      mockUsersService.findAthleteByEmail.mockResolvedValue(null);

      const result = await controller.searchAthleteByEmail(
        'notfound@example.com',
        req,
      );

      expect(result.found).toBe(false);
      expect(result.message).toContain('Atleta no encontrado');
    });

    it('debería lanzar error si no es coach', async () => {
      const req = { user: { userId: 'athleteId', role: 'athlete' } };

      await expect(
        controller.searchAthleteByEmail('athlete@example.com', req),
      ).rejects.toThrow();
    });
  });

  describe('PUT /users/athletes/:athleteId/link-coach - Vincular coach', () => {
    it('debería vincular un coach a un atleta', async () => {
      const req = { user: { userId: 'coachId123', role: 'coach' } };
      const updatedAthlete = {
        _id: 'athleteId',
        fullName: 'Athlete Test',
        email: 'athlete@example.com',
        role: UserRole.ATHLETE,
        coach: 'COACH-ABC123',
      };

      mockUsersService.linkCoachToAthlete.mockResolvedValue(updatedAthlete);

      const result = await controller.linkCoach('athleteId', req);

      expect(result.message).toContain('Atleta vinculado correctamente');
      expect(result.athlete.coach).toBe('COACH-ABC123');
      expect(mockUsersService.linkCoachToAthlete).toHaveBeenCalledWith(
        'athleteId',
        'coachId123',
      );
    });

    it('debería lanzar error si no es coach', async () => {
      const req = { user: { userId: 'athleteId', role: 'athlete' } };

      await expect(controller.linkCoach('athleteId', req)).rejects.toThrow();
    });
  });

  describe('DELETE /users/athletes/:athleteId/coach - Desvincular coach', () => {
    it('debería desvincular el coach del atleta', async () => {
      const req = { user: { userId: 'coachId123', role: 'coach' } };
      const updatedAthlete = {
        _id: 'athleteId',
        fullName: 'Athlete Test',
        email: 'athlete@example.com',
        role: UserRole.ATHLETE,
        coach: undefined,
      };

      mockUsersService.unlinkCoachFromAthlete.mockResolvedValue(
        updatedAthlete,
      );

      const result = await controller.unlinkCoach('athleteId', req);

      expect(result.message).toContain('Entrenador desvinculado correctamente');
      expect(result.athlete.coach).toBeNull();
      expect(mockUsersService.unlinkCoachFromAthlete).toHaveBeenCalledWith(
        'athleteId',
        { userId: 'coachId123', role: 'coach' },
      );
    });
  });

  describe('GET /users/get-userid/:email - Obtener ID de usuario', () => {
    it('debería retornar el ID del atleta por email', async () => {
      mockUsersService.getAthleteId.mockResolvedValue('athleteId123');

      const result = await controller.getUserId('athlete@example.com');

      expect(result.athleteId).toBe('athleteId123');
      expect(mockUsersService.getAthleteId).toHaveBeenCalledWith(
        'athlete@example.com',
      );
    });
  });
});
