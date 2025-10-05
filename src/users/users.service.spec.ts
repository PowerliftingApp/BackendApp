import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { getModelToken } from '@nestjs/mongoose';
import { User, UserRole, UserStatus } from './schemas/user.schema';
import { MailService } from '../mail/mail.service';
import { TrainingPlansService } from '../training-plans/training-plans.service';
import {
  ConflictException,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';

describe('UsersService', () => {
  let service: UsersService;
  let userModel: any;
  let mailService: MailService;
  let trainingPlansService: TrainingPlansService;

  // Mock de usuario
  const mockUser = {
    _id: 'userId123',
    fullName: 'Test User',
    email: 'test@example.com',
    password: 'hashedPassword',
    role: UserRole.ATHLETE,
    status: UserStatus.ACTIVE,
    activationToken: 'token123',
    passwordRecoveryToken: undefined,
    passwordRecoveryExpires: undefined,
    save: jest.fn().mockResolvedValue(this),
  };

  const mockCoach = {
    _id: 'coachId123',
    fullName: 'Test Coach',
    email: 'coach@example.com',
    password: 'hashedPassword',
    role: UserRole.COACH,
    status: UserStatus.ACTIVE,
    coachId: 'COACH-ABC123',
    save: jest.fn().mockResolvedValue(this),
  };

  const mockUserModel = {
    findOne: jest.fn(),
    findById: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    new: jest.fn(),
  };

  const mockMailService = {
    sendActivationEmail: jest.fn(),
    sendPasswordRecoveryEmail: jest.fn(),
  };

  const mockTrainingPlansService = {
    findByAthleteId: jest.fn(),
  };

  beforeEach(async () => {
    // Crear un mock constructor que retorna instancias con save()
    const mockUserConstructor: any = jest.fn().mockImplementation((dto: any) => {
      return {
        ...dto,
        save: jest.fn().mockResolvedValue({ ...dto }),
      };
    });

    // Agregar métodos estáticos del modelo
    mockUserConstructor.findOne = jest.fn();
    mockUserConstructor.findById = jest.fn();
    mockUserConstructor.find = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getModelToken(User.name),
          useValue: mockUserConstructor,
        },
        {
          provide: MailService,
          useValue: mockMailService,
        },
        {
          provide: TrainingPlansService,
          useValue: mockTrainingPlansService,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    userModel = module.get(getModelToken(User.name));
    mailService = module.get<MailService>(MailService);
    trainingPlansService = module.get<TrainingPlansService>(
      TrainingPlansService,
    );

    // Resetear mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Definición del servicio', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });
  });

  describe('create - Crear usuario', () => {
    it('debería crear un usuario atleta exitosamente', async () => {
      const createUserDto = {
        fullName: 'New Athlete',
        email: 'athlete@example.com',
        password: 'Password123!',
        role: UserRole.ATHLETE,
      };

      jest.spyOn(userModel, 'findOne').mockResolvedValueOnce(null);

      const result = await service.create(createUserDto);

      expect(result).toBeDefined();
      expect(result.fullName).toBe(createUserDto.fullName);
      expect(result.email).toBe(createUserDto.email);
      expect(result.role).toBe(UserRole.ATHLETE);
      expect(result.activationToken).toBeDefined();
    });

    it('debería crear un usuario coach con coachId generado', async () => {
      const createUserDto = {
        fullName: 'New Coach',
        email: 'newcoach@example.com',
        password: 'Password123!',
        role: UserRole.COACH,
      };

      jest.spyOn(userModel, 'findOne').mockResolvedValueOnce(null);

      const result = await service.create(createUserDto);

      expect(result).toBeDefined();
      expect(result.fullName).toBe(createUserDto.fullName);
      expect(result.role).toBe(UserRole.COACH);
      expect(result.coachId).toBeDefined();
      expect(result.coachId).toMatch(/^COACH-[A-Z0-9]+$/);
    });

    it('debería lanzar ConflictException si el email ya existe', async () => {
      const createUserDto = {
        fullName: 'Test User',
        email: 'existing@example.com',
        password: 'Password123!',
        role: UserRole.ATHLETE,
      };

      jest.spyOn(userModel, 'findOne').mockResolvedValueOnce(mockUser);

      await expect(service.create(createUserDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('debería lanzar BadRequestException si un coach intenta tener un entrenador asignado', async () => {
      const createUserDto = {
        fullName: 'Invalid Coach',
        email: 'invalid@example.com',
        password: 'Password123!',
        role: UserRole.COACH,
        coach: 'COACH-123',
      };

      jest.spyOn(userModel, 'findOne').mockResolvedValueOnce(null);

      await expect(service.create(createUserDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('debería lanzar BadRequestException si un atleta intenta tener coachId propio', async () => {
      const createUserDto = {
        fullName: 'Invalid Athlete',
        email: 'invalid@example.com',
        password: 'Password123!',
        role: UserRole.ATHLETE,
        coachId: 'COACH-123',
      };

      jest.spyOn(userModel, 'findOne').mockResolvedValueOnce(null);

      await expect(service.create(createUserDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('debería crear atleta con referencia a coach si se proporciona coach válido', async () => {
      const createUserDto = {
        fullName: 'Athlete with Coach',
        email: 'athlete@example.com',
        password: 'Password123!',
        role: UserRole.ATHLETE,
        coach: 'COACH-ABC123',
      };

      jest
        .spyOn(userModel, 'findOne')
        .mockResolvedValueOnce(null) // No existe email
        .mockResolvedValueOnce(mockCoach); // Existe el coach

      const result = await service.create(createUserDto);

      expect(result).toBeDefined();
      expect(result.coach).toBe('COACH-ABC123');
    });

    it('debería lanzar NotFoundException si el coach proporcionado no existe', async () => {
      const createUserDto = {
        fullName: 'Athlete',
        email: 'athlete@example.com',
        password: 'Password123!',
        role: UserRole.ATHLETE,
        coach: 'COACH-INVALID',
      };

      jest
        .spyOn(userModel, 'findOne')
        .mockResolvedValueOnce(null) // No existe email
        .mockResolvedValueOnce(null); // No existe el coach

      await expect(service.create(createUserDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateProfile - Actualizar perfil', () => {
    it('debería actualizar el nombre completo del usuario', async () => {
      const updatedUser = { ...mockUser, fullName: 'Updated Name' };
      updatedUser.save = jest.fn().mockResolvedValue(updatedUser);

      jest.spyOn(userModel, 'findById').mockResolvedValueOnce(updatedUser);

      const result = await service.updateProfile('userId123', {
        fullName: 'Updated Name',
      });

      expect(result.fullName).toBe('Updated Name');
      expect(updatedUser.save).toHaveBeenCalled();
    });

    it('debería actualizar el email si no está en uso', async () => {
      const updatedUser = { ...mockUser, email: 'newemail@example.com' };
      updatedUser.save = jest.fn().mockResolvedValue(updatedUser);

      jest
        .spyOn(userModel, 'findById')
        .mockResolvedValueOnce(updatedUser);
      jest.spyOn(userModel, 'findOne').mockResolvedValueOnce(null);

      const result = await service.updateProfile('userId123', {
        email: 'newemail@example.com',
      });

      expect(result.email).toBe('newemail@example.com');
    });

    it('debería lanzar ConflictException si el nuevo email ya está en uso', async () => {
      const user = { ...mockUser, id: 'userId123' };
      user.save = jest.fn();
      const otherUser = { ...mockUser, id: 'otherUserId', email: 'other@example.com' };

      jest.spyOn(userModel, 'findById').mockResolvedValueOnce(user);
      jest.spyOn(userModel, 'findOne').mockResolvedValueOnce(otherUser);

      await expect(
        service.updateProfile('userId123', { email: 'other@example.com' }),
      ).rejects.toThrow(ConflictException);
    });

    it('debería lanzar NotFoundException si el usuario no existe', async () => {
      jest.spyOn(userModel, 'findById').mockResolvedValueOnce(null);

      await expect(
        service.updateProfile('invalidId', { fullName: 'Test' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('debería lanzar ForbiddenException si la cuenta no está activa', async () => {
      const inactiveUser = { ...mockUser, status: UserStatus.PENDING };
      jest.spyOn(userModel, 'findById').mockResolvedValueOnce(inactiveUser);

      await expect(
        service.updateProfile('userId123', { fullName: 'Test' }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('updateProfilePicture - Actualizar foto de perfil', () => {
    it('debería actualizar la foto de perfil exitosamente', async () => {
      const updatedUser = {
        ...mockUser,
        profilePicture: '/uploads/photo.jpg',
      };
      updatedUser.save = jest.fn().mockResolvedValue(updatedUser);

      jest.spyOn(userModel, 'findById').mockResolvedValueOnce(updatedUser);

      const result = await service.updateProfilePicture(
        'userId123',
        '/uploads/photo.jpg',
      );

      expect(result.profilePicture).toBe('/uploads/photo.jpg');
      expect(updatedUser.save).toHaveBeenCalled();
    });

    it('debería permitir eliminar la foto de perfil (undefined)', async () => {
      const updatedUser = { ...mockUser, profilePicture: undefined };
      updatedUser.save = jest.fn().mockResolvedValue(updatedUser);

      jest.spyOn(userModel, 'findById').mockResolvedValueOnce(updatedUser);

      const result = await service.updateProfilePicture('userId123', undefined);

      expect(result.profilePicture).toBeUndefined();
    });

    it('debería lanzar NotFoundException si el usuario no existe', async () => {
      jest.spyOn(userModel, 'findById').mockResolvedValueOnce(null);

      await expect(
        service.updateProfilePicture('invalidId', '/uploads/photo.jpg'),
      ).rejects.toThrow(NotFoundException);
    });

    it('debería lanzar ForbiddenException si la cuenta no está activa', async () => {
      const inactiveUser = { ...mockUser, status: UserStatus.PENDING };
      jest.spyOn(userModel, 'findById').mockResolvedValueOnce(inactiveUser);

      await expect(
        service.updateProfilePicture('userId123', '/uploads/photo.jpg'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('activateAccount - Activar cuenta', () => {
    it('debería activar la cuenta exitosamente con token válido', async () => {
      const user = {
        ...mockUser,
        status: UserStatus.PENDING,
        activationToken: 'validToken',
      };
      user.save = jest.fn().mockResolvedValue(user);

      jest.spyOn(userModel, 'findOne').mockResolvedValueOnce(user);

      await service.activateAccount('validToken');

      expect(user.status).toBe(UserStatus.ACTIVE);
      expect(user.activationToken).toBe('');
      expect(user.save).toHaveBeenCalled();
    });

    it('debería lanzar BadRequestException con token inválido', async () => {
      jest.spyOn(userModel, 'findOne').mockResolvedValueOnce(null);

      await expect(service.activateAccount('invalidToken')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('findByEmail - Buscar por email', () => {
    it('debería encontrar un usuario por email', async () => {
      jest.spyOn(userModel, 'findOne').mockResolvedValueOnce(mockUser);

      const result = await service.findByEmail('test@example.com');

      expect(result).toBeDefined();
      expect(result.email).toBe('test@example.com');
    });

    it('debería lanzar NotFoundException si el usuario no existe', async () => {
      jest.spyOn(userModel, 'findOne').mockResolvedValueOnce(null);

      await expect(service.findByEmail('notfound@example.com')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findByCoachId - Buscar coach por coachId', () => {
    it('debería encontrar un coach por coachId', async () => {
      jest.spyOn(userModel, 'findOne').mockResolvedValueOnce(mockCoach);

      const result = await service.findByCoachId('COACH-ABC123');

      expect(result).toBeDefined();
      expect(result.coachId).toBe('COACH-ABC123');
    });

    it('debería lanzar NotFoundException si el coach no existe', async () => {
      jest.spyOn(userModel, 'findOne').mockResolvedValueOnce(null);

      await expect(service.findByCoachId('COACH-INVALID')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('requestPasswordRecovery - Solicitar recuperación de contraseña', () => {
    it('debería generar token de recuperación y enviar email', async () => {
      const user = { ...mockUser };
      user.save = jest.fn().mockResolvedValue(user);

      jest.spyOn(userModel, 'findOne').mockResolvedValueOnce(user);

      await service.requestPasswordRecovery('test@example.com');

      expect(user.passwordRecoveryToken).toBeDefined();
      expect(user.passwordRecoveryExpires).toBeDefined();
      expect(user.save).toHaveBeenCalled();
      expect(mockMailService.sendPasswordRecoveryEmail).toHaveBeenCalledWith(
        user.email,
        user.fullName,
        user.passwordRecoveryToken,
      );
    });

    it('debería lanzar NotFoundException si el usuario no existe', async () => {
      jest.spyOn(userModel, 'findOne').mockResolvedValueOnce(null);

      await expect(
        service.requestPasswordRecovery('notfound@example.com'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('resetPassword - Restablecer contraseña', () => {
    it('debería restablecer la contraseña con token válido', async () => {
      const user = {
        ...mockUser,
        passwordRecoveryToken: 'validToken',
        passwordRecoveryExpires: new Date(Date.now() + 3600000),
      };
      user.save = jest.fn().mockResolvedValue(user);

      jest.spyOn(userModel, 'findOne').mockResolvedValueOnce(user);

      await service.resetPassword('validToken', 'NewPassword123!');

      expect(user.password).toBe('NewPassword123!');
      expect(user.passwordRecoveryToken).toBeUndefined();
      expect(user.passwordRecoveryExpires).toBeUndefined();
      expect(user.save).toHaveBeenCalled();
    });

    it('debería lanzar BadRequestException con token expirado', async () => {
      jest.spyOn(userModel, 'findOne').mockResolvedValueOnce(null);

      await expect(
        service.resetPassword('expiredToken', 'NewPassword123!'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getAthletes - Obtener atletas de un coach', () => {
    it('debería retornar lista de atletas de un coach', async () => {
      const athletes = [
        { ...mockUser, coach: 'COACH-ABC123' },
        { ...mockUser, _id: 'athlete2', coach: 'COACH-ABC123' },
      ];

      const mockExec = jest.fn().mockResolvedValue(athletes);
      jest.spyOn(userModel, 'find').mockReturnValue({ exec: mockExec } as any);

      const result = await service.getAthletes('COACH-ABC123');

      expect(result).toHaveLength(2);
      expect(mockExec).toHaveBeenCalled();
    });

    it('debería retornar array vacío si el coach no tiene atletas', async () => {
      const mockExec = jest.fn().mockResolvedValue([]);
      jest.spyOn(userModel, 'find').mockReturnValue({ exec: mockExec } as any);

      const result = await service.getAthletes('COACH-ABC123');

      expect(result).toHaveLength(0);
    });
  });

  describe('linkCoachToAthlete - Vincular coach a atleta', () => {
    it('debería vincular un coach a un atleta exitosamente', async () => {
      const athlete = { ...mockUser, coach: undefined };
      athlete.save = jest.fn().mockResolvedValue(athlete);

      jest
        .spyOn(userModel, 'findById')
        .mockResolvedValueOnce(athlete)
        .mockResolvedValueOnce(mockCoach);

      const result = await service.linkCoachToAthlete(
        'athleteId',
        'coachId123',
      );

      expect(result.coach).toBe('COACH-ABC123');
      expect(athlete.save).toHaveBeenCalled();
    });

    it('debería lanzar NotFoundException si el atleta no existe', async () => {
      jest.spyOn(userModel, 'findById').mockResolvedValueOnce(null);

      await expect(
        service.linkCoachToAthlete('invalidId', 'coachId123'),
      ).rejects.toThrow(NotFoundException);
    });

    it('debería lanzar BadRequestException si el usuario no es atleta', async () => {
      jest.spyOn(userModel, 'findById').mockResolvedValueOnce(mockCoach);

      await expect(
        service.linkCoachToAthlete('coachId123', 'coachId123'),
      ).rejects.toThrow(BadRequestException);
    });

    it('debería lanzar BadRequestException si el atleta ya tiene coach', async () => {
      const athleteWithCoach = { ...mockUser, coach: 'COACH-XYZ' };
      jest
        .spyOn(userModel, 'findById')
        .mockResolvedValueOnce(athleteWithCoach);

      await expect(
        service.linkCoachToAthlete('athleteId', 'coachId123'),
      ).rejects.toThrow(BadRequestException);
    });

    it('debería lanzar NotFoundException si el coach no existe', async () => {
      const athlete = { ...mockUser, coach: undefined };
      jest
        .spyOn(userModel, 'findById')
        .mockResolvedValueOnce(athlete)
        .mockResolvedValueOnce(null);

      await expect(
        service.linkCoachToAthlete('athleteId', 'invalidCoachId'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('unlinkCoachFromAthlete - Desvincular coach de atleta', () => {
    it('debería permitir a un atleta desvincularse de su coach', async () => {
      const athlete = { ...mockUser, id: 'athleteId', coach: 'COACH-ABC123' };
      athlete.save = jest.fn().mockResolvedValue(athlete);

      jest.spyOn(userModel, 'findById').mockResolvedValueOnce(athlete);

      const result = await service.unlinkCoachFromAthlete('athleteId', {
        userId: 'athleteId',
        role: UserRole.ATHLETE,
      });

      expect(result.coach).toBeUndefined();
      expect(athlete.save).toHaveBeenCalled();
    });

    it('debería permitir a un coach desvincular a su atleta', async () => {
      const athlete = { ...mockUser, id: 'athleteId', coach: 'COACH-ABC123' };
      athlete.save = jest.fn().mockResolvedValue(athlete);

      jest
        .spyOn(userModel, 'findById')
        .mockResolvedValueOnce(athlete)
        .mockResolvedValueOnce(mockCoach);

      const result = await service.unlinkCoachFromAthlete('athleteId', {
        userId: 'coachId123',
        role: UserRole.COACH,
      });

      expect(result.coach).toBeUndefined();
    });

    it('debería lanzar NotFoundException si el atleta no existe', async () => {
      jest.spyOn(userModel, 'findById').mockResolvedValueOnce(null);

      await expect(
        service.unlinkCoachFromAthlete('invalidId', {
          userId: 'coachId123',
          role: UserRole.COACH,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('debería lanzar BadRequestException si el atleta no tiene coach', async () => {
      const athlete = { ...mockUser, coach: undefined };
      jest.spyOn(userModel, 'findById').mockResolvedValueOnce(athlete);

      await expect(
        service.unlinkCoachFromAthlete('athleteId', {
          userId: 'coachId123',
          role: UserRole.COACH,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('debería lanzar ForbiddenException si un atleta intenta desvincular a otro atleta', async () => {
      const athlete = { ...mockUser, id: 'athleteId', coach: 'COACH-ABC123' };
      jest.spyOn(userModel, 'findById').mockResolvedValueOnce(athlete);

      await expect(
        service.unlinkCoachFromAthlete('athleteId', {
          userId: 'otherAthleteId',
          role: UserRole.ATHLETE,
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('debería lanzar ForbiddenException si un coach intenta desvincular atleta que no es suyo', async () => {
      const athlete = { ...mockUser, id: 'athleteId', coach: 'COACH-XYZ' };
      const otherCoach = { ...mockCoach, coachId: 'COACH-OTHER' };

      jest
        .spyOn(userModel, 'findById')
        .mockResolvedValueOnce(athlete)
        .mockResolvedValueOnce(otherCoach);

      await expect(
        service.unlinkCoachFromAthlete('athleteId', {
          userId: 'otherCoachId',
          role: UserRole.COACH,
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('getAthleteDetails - Obtener detalles de atleta', () => {
    it('debería retornar detalles completos de un atleta', async () => {
      const athlete = {
        ...mockUser,
        id: 'athleteId',
        coach: 'COACH-ABC123',
        createdAt: new Date(),
      };

      const plans = [
        {
          sessions: [{ completed: true }, { completed: false }],
        },
        {
          sessions: [{ completed: true }],
        },
      ];

      jest
        .spyOn(userModel, 'findById')
        .mockResolvedValueOnce(athlete)
        .mockResolvedValueOnce(mockCoach);

      jest
        .spyOn(mockTrainingPlansService, 'findByAthleteId')
        .mockResolvedValue(plans);

      const result = await service.getAthleteDetails('athleteId', 'coachId123');

      expect(result).toBeDefined();
      expect(result.fullName).toBe(athlete.fullName);
      expect(result.stats).toBeDefined();
      expect(result.stats.totalTrainingPlans).toBe(2);
      expect(result.stats.completedSessions).toBe(2);
    });

    it('debería lanzar NotFoundException si el atleta no existe', async () => {
      jest.spyOn(userModel, 'findById').mockResolvedValueOnce(null);

      await expect(
        service.getAthleteDetails('invalidId', 'coachId123'),
      ).rejects.toThrow(NotFoundException);
    });

    it('debería lanzar BadRequestException si el usuario no es atleta', async () => {
      jest.spyOn(userModel, 'findById').mockResolvedValueOnce(mockCoach);

      await expect(
        service.getAthleteDetails('coachId123', 'coachId123'),
      ).rejects.toThrow(BadRequestException);
    });

    it('debería lanzar ForbiddenException si el coach no es el propietario del atleta', async () => {
      const athlete = { ...mockUser, coach: 'COACH-XYZ' };
      jest
        .spyOn(userModel, 'findById')
        .mockResolvedValueOnce(athlete)
        .mockResolvedValueOnce(mockCoach);

      await expect(
        service.getAthleteDetails('athleteId', 'coachId123'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('getAthleteId - Obtener ID de atleta por email', () => {
    it('debería retornar el ID del atleta', async () => {
      jest.spyOn(userModel, 'findOne').mockResolvedValueOnce(mockUser);

      const result = await service.getAthleteId('test@example.com');

      expect(result).toBe('userId123');
    });

    it('debería lanzar NotFoundException si el atleta no existe', async () => {
      jest.spyOn(userModel, 'findOne').mockResolvedValueOnce(null);

      await expect(
        service.getAthleteId('notfound@example.com'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAthleteByEmail - Buscar atleta activo por email', () => {
    it('debería encontrar un atleta activo por email', async () => {
      jest.spyOn(userModel, 'findOne').mockResolvedValueOnce(mockUser);

      const result = await service.findAthleteByEmail('test@example.com');

      expect(result).toBeDefined();
      expect(result).not.toBeNull();
      if (result) {
        expect(result.email).toBe('test@example.com');
      }
    });

    it('debería retornar null si no encuentra el atleta', async () => {
      jest.spyOn(userModel, 'findOne').mockResolvedValueOnce(null);

      const result = await service.findAthleteByEmail('notfound@example.com');

      expect(result).toBeNull();
    });
  });

  describe('getCoachIdForAthlete - Obtener coachId de un atleta', () => {
    it('debería retornar el coachId del atleta', async () => {
      const athlete = { ...mockUser, coach: 'COACH-ABC123' };
      jest.spyOn(userModel, 'findById').mockReturnValue({
        lean: jest.fn().mockResolvedValue(athlete),
      } as any);

      const result = await service.getCoachIdForAthlete('athleteId');

      expect(result).toBe('COACH-ABC123');
    });

    it('debería retornar null si el atleta no tiene coach', async () => {
      const athlete = { ...mockUser, coach: undefined };
      jest.spyOn(userModel, 'findById').mockReturnValue({
        lean: jest.fn().mockResolvedValue(athlete),
      } as any);

      const result = await service.getCoachIdForAthlete('athleteId');

      expect(result).toBeNull();
    });

    it('debería retornar null si el atleta no existe', async () => {
      jest.spyOn(userModel, 'findById').mockReturnValue({
        lean: jest.fn().mockResolvedValue(null),
      } as any);

      const result = await service.getCoachIdForAthlete('invalidId');

      expect(result).toBeNull();
    });
  });
});
