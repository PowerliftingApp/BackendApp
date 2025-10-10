import { Test, TestingModule } from '@nestjs/testing';
import { TrainingPlansController } from './training-plans.controller';
import { TrainingPlansService } from './training-plans.service';
import { UnauthorizedException } from '@nestjs/common';

describe('TrainingPlansController', () => {
  let controller: TrainingPlansController;
  let service: TrainingPlansService;

  const mockPlanId = '507f1f77bcf86cd799439011';
  const mockAthleteId = '507f1f77bcf86cd799439012';
  const mockCoachId = '507f1f77bcf86cd799439013';

  const mockTrainingPlan = {
    _id: mockPlanId,
    athleteId: {
      _id: mockAthleteId,
      fullName: 'John Doe',
      email: 'john@example.com',
    },
    coachId: mockCoachId,
    name: 'Plan de Fuerza',
    startDate: new Date('2025-01-01'),
    endDate: new Date('2025-03-01'),
    isTemplate: false,
    sessions: [
      {
        sessionId: 'S-123456',
        sessionName: 'Día 1',
        date: '2025-01-05',
        sessionNotes: null,
        completed: false,
        exercises: [
          {
            exerciseId: 'E-123456',
            name: 'Press Banca',
            sets: 4,
            reps: 10,
            completed: false,
            performedSets: [],
          },
        ],
      },
    ],
  };

  const mockTrainingPlansService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    findByAthleteId: jest.fn(),
    findByCoachId: jest.fn(),
    findByCoachAndAthlete: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    submitExerciseFeedback: jest.fn(),
    updateSessionNotes: jest.fn(),
    submitPerformedSets: jest.fn(),
    convertToTemplate: jest.fn(),
    removeTemplateStatus: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TrainingPlansController],
      providers: [
        {
          provide: TrainingPlansService,
          useValue: mockTrainingPlansService,
        },
      ],
    }).compile();

    controller = module.get<TrainingPlansController>(TrainingPlansController);
    service = module.get<TrainingPlansService>(TrainingPlansService);

    // Resetear mocks antes de cada prueba
    jest.clearAllMocks();
  });

  describe('Definición del controlador', () => {
    it('debe estar definido el controlador', () => {
      expect(controller).toBeDefined();
    });
  });

  describe('POST /training-plans', () => {
    it('debe crear un plan de entrenamiento', async () => {
      const createDto = {
        athleteId: mockAthleteId,
        coachId: mockCoachId,
        name: 'Nuevo Plan',
        startDate: '2025-01-01',
        endDate: '2025-03-01',
        sessions: [],
      };

      mockTrainingPlansService.create.mockResolvedValue(mockTrainingPlan);

      const result = await controller.create(createDto);

      expect(result).toEqual(mockTrainingPlan);
      expect(service.create).toHaveBeenCalledWith(createDto);
    });

    it('debe crear un plan con sesiones y ejercicios', async () => {
      const createDto = {
        athleteId: mockAthleteId,
        coachId: mockCoachId,
        name: 'Plan Completo',
        startDate: '2025-01-01',
        endDate: '2025-03-01',
        sessions: [
          {
            sessionName: 'Día 1',
            date: '2025-01-05',
            exercises: [
              {
                name: 'Sentadilla',
                sets: 4,
                reps: 10,
              },
            ],
          },
        ],
      };

      mockTrainingPlansService.create.mockResolvedValue(mockTrainingPlan);

      const result = await controller.create(createDto);

      expect(result).toBeDefined();
      expect(service.create).toHaveBeenCalledWith(createDto);
    });
  });

  describe('GET /training-plans', () => {
    it('debe retornar todos los planes sin filtros', async () => {
      const mockPlans = [mockTrainingPlan];
      mockTrainingPlansService.findAll.mockResolvedValue(mockPlans);

      const result = await controller.findAll();

      expect(result).toEqual(mockPlans);
      expect(service.findAll).toHaveBeenCalled();
    });

    it('debe retornar planes filtrados por athleteId', async () => {
      const mockPlans = [mockTrainingPlan];
      mockTrainingPlansService.findByAthleteId.mockResolvedValue(mockPlans);

      const result = await controller.findAll(mockAthleteId);

      expect(result).toEqual(mockPlans);
      expect(service.findByAthleteId).toHaveBeenCalledWith(mockAthleteId);
    });

    it('debe retornar planes filtrados por coachId', async () => {
      const mockPlans = [mockTrainingPlan];
      mockTrainingPlansService.findByCoachId.mockResolvedValue(mockPlans);

      const result = await controller.findAll(undefined, mockCoachId);

      expect(result).toEqual(mockPlans);
      expect(service.findByCoachId).toHaveBeenCalledWith(mockCoachId);
    });

    it('debe retornar planes filtrados por coachId y athleteId', async () => {
      const mockPlans = [mockTrainingPlan];
      mockTrainingPlansService.findByCoachAndAthlete.mockResolvedValue(mockPlans);

      const result = await controller.findAll(mockAthleteId, mockCoachId);

      expect(result).toEqual(mockPlans);
      expect(service.findByCoachAndAthlete).toHaveBeenCalledWith(mockCoachId, mockAthleteId);
    });

    it('debe priorizar filtro combinado sobre filtros individuales', async () => {
      mockTrainingPlansService.findByCoachAndAthlete.mockResolvedValue([]);

      await controller.findAll(mockAthleteId, mockCoachId);

      expect(service.findByCoachAndAthlete).toHaveBeenCalled();
      expect(service.findByAthleteId).not.toHaveBeenCalled();
      expect(service.findByCoachId).not.toHaveBeenCalled();
    });
  });

  describe('GET /training-plans/:id', () => {
    it('debe retornar un plan por ID', async () => {
      mockTrainingPlansService.findOne.mockResolvedValue(mockTrainingPlan);

      const result = await controller.findOne(mockPlanId);

      expect(result).toEqual(mockTrainingPlan);
      expect(service.findOne).toHaveBeenCalledWith(mockPlanId);
    });
  });

  describe('PATCH /training-plans/:id', () => {
    it('debe actualizar un plan de entrenamiento', async () => {
      const updateDto = {
        name: 'Plan Actualizado',
      };

      const updatedPlan = { ...mockTrainingPlan, name: 'Plan Actualizado' };
      mockTrainingPlansService.update.mockResolvedValue(updatedPlan);

      const result = await controller.update(mockPlanId, updateDto);

      expect(result).toEqual(updatedPlan);
      expect(service.update).toHaveBeenCalledWith(mockPlanId, updateDto);
    });

    it('debe actualizar fechas del plan', async () => {
      const updateDto = {
        startDate: '2025-02-01',
        endDate: '2025-04-01',
      };

      mockTrainingPlansService.update.mockResolvedValue(mockTrainingPlan);

      const result = await controller.update(mockPlanId, updateDto);

      expect(result).toBeDefined();
      expect(service.update).toHaveBeenCalledWith(mockPlanId, updateDto);
    });
  });

  describe('DELETE /training-plans/:id', () => {
    it('debe eliminar un plan de entrenamiento', async () => {
      mockTrainingPlansService.remove.mockResolvedValue(undefined);

      const result = await controller.remove(mockPlanId);

      expect(result).toBeUndefined();
      expect(service.remove).toHaveBeenCalledWith(mockPlanId);
    });
  });

  describe('POST /training-plans/:id/convert-to-template', () => {
    it('debe convertir un plan en plantilla', async () => {
      const templateData = {
        name: 'Plantilla desde Plan',
        description: 'Descripción',
        createdBy: mockCoachId,
      };

      const mockTemplate = {
        _id: 'template-id',
        name: templateData.name,
      };

      mockTrainingPlansService.convertToTemplate.mockResolvedValue(mockTemplate);

      const result = await controller.convertToTemplate(mockPlanId, templateData);

      expect(result).toEqual(mockTemplate);
      expect(service.convertToTemplate).toHaveBeenCalledWith({
        ...templateData,
        planId: mockPlanId,
      });
    });

    it('debe incluir el planId en el DTO de conversión', async () => {
      const templateData = {
        name: 'Nueva Plantilla',
        description: 'Desc',
        createdBy: mockCoachId,
      };

      mockTrainingPlansService.convertToTemplate.mockResolvedValue({});

      await controller.convertToTemplate(mockPlanId, templateData);

      const callArg = mockTrainingPlansService.convertToTemplate.mock.calls[0][0];
      expect(callArg.planId).toBe(mockPlanId);
    });
  });

  describe('PATCH /training-plans/:id/remove-template-status', () => {
    it('debe quitar el estado de plantilla de un plan', async () => {
      const updatedPlan = { ...mockTrainingPlan, isTemplate: false };
      mockTrainingPlansService.removeTemplateStatus.mockResolvedValue(updatedPlan);

      const result = await controller.removeTemplateStatus(mockPlanId);

      expect(result).toEqual(updatedPlan);
      expect(service.removeTemplateStatus).toHaveBeenCalledWith(mockPlanId);
    });
  });

  describe('POST /training-plans/feedback/exercise', () => {
    it('debe enviar feedback de ejercicio sin archivo', async () => {
      const feedbackDto = {
        planId: mockPlanId,
        sessionId: 'S-123456',
        exerciseId: 'E-123456',
        completed: true,
        performanceComment: 'Buen rendimiento',
        athleteNotes: 'Me sentí fuerte',
      };

      const mockRequest = {
        user: { userId: mockAthleteId, role: 'athlete' },
      };

      mockTrainingPlansService.submitExerciseFeedback.mockResolvedValue(mockTrainingPlan);

      const result = await controller.submitExerciseFeedback(
        feedbackDto,
        undefined,
        mockRequest,
      );

      expect(result).toEqual(mockTrainingPlan);
      expect(service.submitExerciseFeedback).toHaveBeenCalledWith({
        ...feedbackDto,
        athleteId: mockAthleteId,
        mediaUrl: undefined,
      });
    });

    it('debe enviar feedback de ejercicio con archivo multimedia', async () => {
      const feedbackDto = {
        planId: mockPlanId,
        sessionId: 'S-123456',
        exerciseId: 'E-123456',
        completed: true,
      };

      const mockFile = {
        filename: 'video-123.mp4',
        originalname: 'video.mp4',
      };

      const mockRequest = {
        user: { userId: mockAthleteId, role: 'athlete' },
      };

      mockTrainingPlansService.submitExerciseFeedback.mockResolvedValue(mockTrainingPlan);

      const result = await controller.submitExerciseFeedback(
        feedbackDto,
        mockFile,
        mockRequest,
      );

      expect(result).toEqual(mockTrainingPlan);
      expect(service.submitExerciseFeedback).toHaveBeenCalledWith({
        ...feedbackDto,
        athleteId: mockAthleteId,
        mediaUrl: 'uploads/video-123.mp4',
      });
    });

    it('debe extraer el athleteId del usuario autenticado', async () => {
      const feedbackDto = {
        planId: mockPlanId,
        sessionId: 'S-123456',
        exerciseId: 'E-123456',
        completed: true,
      };

      const mockRequest = {
        user: { userId: 'custom-athlete-id', role: 'athlete' },
      };

      mockTrainingPlansService.submitExerciseFeedback.mockResolvedValue(mockTrainingPlan);

      await controller.submitExerciseFeedback(feedbackDto, undefined, mockRequest);

      const callArg = mockTrainingPlansService.submitExerciseFeedback.mock.calls[0][0];
      expect(callArg.athleteId).toBe('custom-athlete-id');
    });
  });

  describe('PATCH /training-plans/feedback/session-notes', () => {
    it('debe actualizar las notas de una sesión', async () => {
      const notesDto = {
        planId: mockPlanId,
        sessionId: 'S-123456',
        sessionNotes: 'Sesión muy intensa',
      };

      const mockRequest = {
        user: { userId: mockAthleteId, role: 'athlete' },
      };

      mockTrainingPlansService.updateSessionNotes.mockResolvedValue(mockTrainingPlan);

      const result = await controller.updateSessionNotes(notesDto, mockRequest);

      expect(result).toEqual(mockTrainingPlan);
      expect(service.updateSessionNotes).toHaveBeenCalledWith({
        ...notesDto,
        athleteId: mockAthleteId,
      });
    });
  });

  describe('PATCH /training-plans/feedback/exercise-sets', () => {
    it('debe actualizar los sets realizados de un ejercicio', async () => {
      const setsDto = {
        planId: mockPlanId,
        sessionId: 'S-123456',
        exerciseId: 'E-123456',
        sets: [
          {
            setId: 'PS-111111',
            completed: true,
            repsPerformed: 10,
            loadUsed: 80,
          },
        ],
      };

      const mockRequest = {
        user: { userId: mockAthleteId, role: 'athlete' },
      };

      mockTrainingPlansService.submitPerformedSets.mockResolvedValue(mockTrainingPlan);

      const result = await controller.submitPerformedSets(setsDto, mockRequest);

      expect(result).toEqual(mockTrainingPlan);
      expect(service.submitPerformedSets).toHaveBeenCalledWith({
        ...setsDto,
        athleteId: mockAthleteId,
      });
    });

    it('debe pasar múltiples sets en la actualización', async () => {
      const setsDto = {
        planId: mockPlanId,
        sessionId: 'S-123456',
        exerciseId: 'E-123456',
        sets: [
          { setId: 'PS-111111', completed: true, repsPerformed: 10, loadUsed: 80 },
          { setId: 'PS-222222', completed: true, repsPerformed: 9, loadUsed: 80 },
          { setId: 'PS-333333', completed: true, repsPerformed: 8, loadUsed: 80 },
        ],
      };

      const mockRequest = {
        user: { userId: mockAthleteId, role: 'athlete' },
      };

      mockTrainingPlansService.submitPerformedSets.mockResolvedValue(mockTrainingPlan);

      await controller.submitPerformedSets(setsDto, mockRequest);

      const callArg = mockTrainingPlansService.submitPerformedSets.mock.calls[0][0];
      expect(callArg.sets).toHaveLength(3);
    });
  });

  describe('GET /training-plans/dashboard/:coachId', () => {
    it('debe retornar estadísticas del dashboard para un coach', async () => {
      const mockPlans = [
        {
          ...mockTrainingPlan,
          sessions: [
            {
              sessionName: 'Día 1',
              date: new Date().toISOString(),
              completed: false,
              exercises: [],
            },
            {
              sessionName: 'Día 2',
              date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
              completed: true,
              exercises: [],
            },
          ],
        },
      ];

      const mockRequest = {
        user: { userId: mockCoachId, role: 'coach', coachId: mockCoachId },
      };

      mockTrainingPlansService.findByCoachId.mockResolvedValue(mockPlans);

      const result = await controller.getDashboardStats(mockCoachId, mockRequest);

      expect(result).toBeDefined();
      expect(result.stats).toBeDefined();
      expect(result.stats.activePlans).toBeDefined();
      expect(result.stats.completedSessionsThisWeek).toBeDefined();
      expect(result.stats.completionRate).toBeDefined();
      expect(result.weeklyProgress).toBeDefined();
      expect(result.upcomingSessions).toBeDefined();
      expect(result.sessionDistribution).toBeDefined();
    });

    it('debe lanzar UnauthorizedException si el usuario no es coach', async () => {
      const mockRequest = {
        user: { userId: mockAthleteId, role: 'athlete', coachId: null },
      };

      await expect(
        controller.getDashboardStats(mockCoachId, mockRequest)
      ).rejects.toThrow(
        new UnauthorizedException('Solo los coaches pueden acceder al dashboard')
      );
    });

    it('debe lanzar UnauthorizedException si el coach intenta acceder a dashboard de otro coach', async () => {
      const mockRequest = {
        user: { userId: 'otro-coach-id', role: 'coach', coachId: 'otro-coach-id' },
      };

      await expect(
        controller.getDashboardStats(mockCoachId, mockRequest)
      ).rejects.toThrow(
        new UnauthorizedException('No autorizado para acceder a este dashboard')
      );
    });

    it('debe calcular correctamente el número de planes activos', async () => {
      const mockPlans = [
        {
          _id: '1',
          sessions: [
            { completed: false, date: new Date().toISOString(), exercises: [] },
            { completed: true, date: new Date().toISOString(), exercises: [] },
          ],
        },
        {
          _id: '2',
          sessions: [
            { completed: true, date: new Date().toISOString(), exercises: [] },
            { completed: true, date: new Date().toISOString(), exercises: [] },
          ],
        },
      ];

      const mockRequest = {
        user: { userId: mockCoachId, role: 'coach', coachId: mockCoachId },
      };

      mockTrainingPlansService.findByCoachId.mockResolvedValue(mockPlans);

      const result = await controller.getDashboardStats(mockCoachId, mockRequest);

      expect(result.stats.activePlans).toBe(1);
    });

    it('debe generar progreso semanal con 7 días', async () => {
      const mockRequest = {
        user: { userId: mockCoachId, role: 'coach', coachId: mockCoachId },
      };

      mockTrainingPlansService.findByCoachId.mockResolvedValue([]);

      const result = await controller.getDashboardStats(mockCoachId, mockRequest);

      expect(result.weeklyProgress).toHaveLength(7);
    });

    it('debe incluir distribución de sesiones', async () => {
      const mockRequest = {
        user: { userId: mockCoachId, role: 'coach', coachId: mockCoachId },
      };

      mockTrainingPlansService.findByCoachId.mockResolvedValue([]);

      const result = await controller.getDashboardStats(mockCoachId, mockRequest);

      expect(result.sessionDistribution).toBeDefined();
      expect(result.sessionDistribution).toHaveLength(3);
      expect(result.sessionDistribution[0].name).toBe('Completadas');
      expect(result.sessionDistribution[1].name).toBe('Próximas (7 días)');
      expect(result.sessionDistribution[2].name).toBe('Pendientes');
    });

    it('debe ordenar sesiones próximas por fecha', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const dayAfterTomorrow = new Date();
      dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);

      const mockPlans = [
        {
          _id: mockPlanId,
          athleteId: { fullName: 'Atleta 1' },
          sessions: [
            {
              sessionId: 'S-2',
              sessionName: 'Sesión 2',
              date: dayAfterTomorrow.toISOString(),
              completed: false,
              exercises: [],
            },
            {
              sessionId: 'S-1',
              sessionName: 'Sesión 1',
              date: tomorrow.toISOString(),
              completed: false,
              exercises: [],
            },
          ],
        },
      ];

      const mockRequest = {
        user: { userId: mockCoachId, role: 'coach', coachId: mockCoachId },
      };

      mockTrainingPlansService.findByCoachId.mockResolvedValue(mockPlans);

      const result = await controller.getDashboardStats(mockCoachId, mockRequest);

      expect(result.upcomingSessions[0].sessionName).toBe('Sesión 1');
    });

    it('debe limitar sesiones próximas a 5', async () => {
      const mockPlans = [{
        _id: mockPlanId,
        athleteId: { fullName: 'Atleta' },
        sessions: Array.from({ length: 10 }, (_, i) => {
          const date = new Date();
          date.setDate(date.getDate() + i + 1);
          return {
            sessionId: `S-${i}`,
            sessionName: `Sesión ${i}`,
            date: date.toISOString(),
            completed: false,
            exercises: [],
          };
        }),
      }];

      const mockRequest = {
        user: { userId: mockCoachId, role: 'coach', coachId: mockCoachId },
      };

      mockTrainingPlansService.findByCoachId.mockResolvedValue(mockPlans);

      const result = await controller.getDashboardStats(mockCoachId, mockRequest);

      expect(result.upcomingSessions.length).toBeLessThanOrEqual(5);
    });
  });
});
