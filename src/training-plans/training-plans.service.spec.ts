import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { TrainingPlansService } from './training-plans.service';
import { TrainingPlan } from './schemas/training-plan.schema';
import { TemplatesService } from '../templates/templates.service';
import { NotFoundException } from '@nestjs/common';

describe('TrainingPlansService', () => {
  let service: TrainingPlansService;
  let trainingPlanModel: any;
  let templatesService: TemplatesService;

  const mockPlanId = '507f1f77bcf86cd799439011';
  const mockAthleteId = '507f1f77bcf86cd799439012';
  const mockCoachId = '507f1f77bcf86cd799439013';
  const mockTemplateId = '507f1f77bcf86cd799439014';

  const mockTrainingPlan = {
    _id: mockPlanId,
    athleteId: mockAthleteId,
    coachId: mockCoachId,
    name: 'Plan de Fuerza',
    startDate: new Date('2025-01-01'),
    endDate: new Date('2025-03-01'),
    isTemplate: false,
    sessions: [
      {
        sessionId: 'S-123456',
        sessionName: 'Día 1 - Tren Superior',
        date: '2025-01-05',
        sessionNotes: null,
        completed: false,
        exercises: [
          {
            exerciseId: 'E-123456',
            name: 'Press Banca',
            sets: 4,
            reps: 10,
            rpe: 8,
            rir: null,
            rm: null,
            notes: null,
            weight: 80,
            completed: false,
            performanceComment: null,
            mediaUrl: null,
            athleteNotes: null,
            performedSets: [
              {
                setId: 'PS-111111',
                setNumber: 1,
                repsPerformed: null,
                loadUsed: null,
                measureAchieved: null,
                completed: false,
              },
              {
                setId: 'PS-222222',
                setNumber: 2,
                repsPerformed: null,
                loadUsed: null,
                measureAchieved: null,
                completed: false,
              },
              {
                setId: 'PS-333333',
                setNumber: 3,
                repsPerformed: null,
                loadUsed: null,
                measureAchieved: null,
                completed: false,
              },
              {
                setId: 'PS-444444',
                setNumber: 4,
                repsPerformed: null,
                loadUsed: null,
                measureAchieved: null,
                completed: false,
              },
            ],
          },
        ],
      },
    ],
    save: jest.fn().mockResolvedValue(this),
    markModified: jest.fn(),
  };

  // Mock del modelo como función constructora
  const mockTrainingPlanModel: any = jest.fn().mockImplementation((data) => ({
    ...data,
    save: jest.fn().mockResolvedValue({ ...data, _id: mockPlanId }),
    markModified: jest.fn(),
  }));

  mockTrainingPlanModel.find = jest.fn();
  mockTrainingPlanModel.findById = jest.fn();
  mockTrainingPlanModel.findByIdAndUpdate = jest.fn();
  mockTrainingPlanModel.deleteOne = jest.fn();
  mockTrainingPlanModel.exec = jest.fn();

  const mockTemplatesService = {
    createFromTrainingPlan: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TrainingPlansService,
        {
          provide: getModelToken(TrainingPlan.name),
          useValue: mockTrainingPlanModel,
        },
        {
          provide: TemplatesService,
          useValue: mockTemplatesService,
        },
      ],
    }).compile();

    service = module.get<TrainingPlansService>(TrainingPlansService);
    trainingPlanModel = module.get(getModelToken(TrainingPlan.name));
    templatesService = module.get<TemplatesService>(TemplatesService);

    // Resetear mocks antes de cada prueba
    jest.clearAllMocks();
  });

  describe('Definición del servicio', () => {
    it('debe estar definido el servicio', () => {
      expect(service).toBeDefined();
    });
  });

  describe('create', () => {
    it('debe crear un plan de entrenamiento con IDs generados automáticamente', async () => {
      const createDto = {
        athleteId: mockAthleteId,
        coachId: mockCoachId,
        name: 'Nuevo Plan',
        startDate: '2025-01-01',
        endDate: '2025-03-01',
        sessions: [
          {
            sessionName: 'Día 1',
            date: '2025-01-05',
            exercises: [
              {
                name: 'Sentadilla',
                sets: 3,
                reps: 10,
              },
            ],
          },
        ],
      };

      const result = await service.create(createDto);

      expect(result).toBeDefined();
      expect(mockTrainingPlanModel).toHaveBeenCalled();
    });

    it('debe generar IDs únicos para sesiones, ejercicios y sets', async () => {
      const createDto = {
        athleteId: mockAthleteId,
        coachId: mockCoachId,
        name: 'Plan con IDs',
        startDate: '2025-01-01',
        endDate: '2025-03-01',
        sessions: [
          {
            sessionName: 'Sesión 1',
            date: '2025-01-05',
            exercises: [
              {
                name: 'Press Banca',
                sets: 2,
                reps: 8,
              },
            ],
          },
        ],
      };

      await service.create(createDto);

      const callArg = mockTrainingPlanModel.mock.calls[0][0];
      expect(callArg.sessions[0].sessionId).toMatch(/^S-/);
      expect(callArg.sessions[0].exercises[0].exerciseId).toMatch(/^E-/);
      expect(callArg.sessions[0].exercises[0].performedSets[0].setId).toMatch(/^PS-/);
    });

    it('debe crear performedSets vacíos según el número de sets', async () => {
      const createDto = {
        athleteId: mockAthleteId,
        coachId: mockCoachId,
        name: 'Plan con Sets',
        startDate: '2025-01-01',
        endDate: '2025-03-01',
        sessions: [
          {
            sessionName: 'Día 1',
            date: '2025-01-05',
            exercises: [
              {
                name: 'Peso Muerto',
                sets: 5,
                reps: 5,
              },
            ],
          },
        ],
      };

      await service.create(createDto);

      const callArg = mockTrainingPlanModel.mock.calls[0][0];
      expect(callArg.sessions[0].exercises[0].performedSets).toHaveLength(5);
    });

    it('debe establecer valores por defecto para campos opcionales', async () => {
      const createDto = {
        athleteId: mockAthleteId,
        coachId: mockCoachId,
        name: 'Plan Básico',
        startDate: '2025-01-01',
        endDate: '2025-03-01',
        sessions: [
          {
            sessionName: 'Día 1',
            date: '2025-01-05',
            exercises: [
              {
                name: 'Dominadas',
                sets: 3,
                reps: 8,
              },
            ],
          },
        ],
      };

      await service.create(createDto);

      const callArg = mockTrainingPlanModel.mock.calls[0][0];
      const exercise = callArg.sessions[0].exercises[0];
      expect(exercise.rpe).toBeNull();
      expect(exercise.rir).toBeNull();
      expect(exercise.rm).toBeNull();
      expect(exercise.notes).toBeNull();
      expect(exercise.weight).toBeNull();
      expect(exercise.completed).toBe(false);
    });
  });

  describe('findAll', () => {
    it('debe retornar todos los planes de entrenamiento', async () => {
      const mockPlans = [mockTrainingPlan, { ...mockTrainingPlan, _id: 'otro-id' }];

      mockTrainingPlanModel.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockPlans),
        }),
      });

      const result = await service.findAll();

      expect(result).toEqual(mockPlans);
      expect(mockTrainingPlanModel.find).toHaveBeenCalled();
    });

    it('debe popular el campo athleteId con fullName y email', async () => {
      const populateMock = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue([]),
      });

      mockTrainingPlanModel.find.mockReturnValue({
        populate: populateMock,
      });

      await service.findAll();

      expect(populateMock).toHaveBeenCalledWith('athleteId', 'fullName email');
    });
  });

  describe('findOne', () => {
    it('debe retornar un plan de entrenamiento por ID', async () => {
      mockTrainingPlanModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockTrainingPlan),
        }),
      });

      const result = await service.findOne(mockPlanId);

      expect(result).toEqual(mockTrainingPlan);
      expect(mockTrainingPlanModel.findById).toHaveBeenCalledWith(mockPlanId);
    });

    it('debe lanzar NotFoundException si el plan no existe', async () => {
      mockTrainingPlanModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(null),
        }),
      });

      await expect(service.findOne('id_inexistente')).rejects.toThrow(
        new NotFoundException('Training plan con ID id_inexistente no encontrado')
      );
    });
  });

  describe('findByAthleteId', () => {
    it('debe retornar planes filtrados por ID de atleta', async () => {
      const athletePlans = [mockTrainingPlan];

      mockTrainingPlanModel.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(athletePlans),
        }),
      });

      const result = await service.findByAthleteId(mockAthleteId);

      expect(result).toEqual(athletePlans);
      expect(mockTrainingPlanModel.find).toHaveBeenCalledWith({ athleteId: mockAthleteId });
    });
  });

  describe('findByCoachId', () => {
    it('debe retornar planes filtrados por ID de coach', async () => {
      const coachPlans = [mockTrainingPlan];

      mockTrainingPlanModel.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(coachPlans),
        }),
      });

      const result = await service.findByCoachId(mockCoachId);

      expect(result).toEqual(coachPlans);
      expect(mockTrainingPlanModel.find).toHaveBeenCalledWith({ coachId: mockCoachId });
    });
  });

  describe('findByCoachAndAthlete', () => {
    it('debe retornar planes filtrados por coach y atleta', async () => {
      const specificPlans = [mockTrainingPlan];

      mockTrainingPlanModel.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(specificPlans),
        }),
      });

      const result = await service.findByCoachAndAthlete(mockCoachId, mockAthleteId);

      expect(result).toEqual(specificPlans);
      expect(mockTrainingPlanModel.find).toHaveBeenCalledWith({
        coachId: mockCoachId,
        athleteId: mockAthleteId,
      });
    });
  });

  describe('update', () => {
    it('debe actualizar un plan de entrenamiento correctamente', async () => {
      const updateDto = {
        name: 'Plan Actualizado',
      };

      const updatedPlan = { ...mockTrainingPlan, name: 'Plan Actualizado' };

      mockTrainingPlanModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockTrainingPlan),
      });

      mockTrainingPlanModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(updatedPlan),
      });

      const result = await service.update(mockPlanId, updateDto);

      expect(result).toEqual(updatedPlan);
      expect(mockTrainingPlanModel.findByIdAndUpdate).toHaveBeenCalledWith(
        mockPlanId,
        expect.objectContaining({ name: 'Plan Actualizado' }),
        { new: true }
      );
    });

    it('debe lanzar NotFoundException si el plan no existe', async () => {
      mockTrainingPlanModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.update('id_inexistente', { name: 'Nuevo' })).rejects.toThrow(
        new NotFoundException('Training plan con ID id_inexistente no encontrado')
      );
    });

    it('debe actualizar fechas correctamente', async () => {
      const updateDto = {
        startDate: '2025-02-01',
        endDate: '2025-04-01',
      };

      mockTrainingPlanModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockTrainingPlan),
      });

      mockTrainingPlanModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue({}),
      });

      await service.update(mockPlanId, updateDto);

      const callArg = mockTrainingPlanModel.findByIdAndUpdate.mock.calls[0][1];
      expect(callArg.startDate).toBeInstanceOf(Date);
      expect(callArg.endDate).toBeInstanceOf(Date);
    });

    it('debe preservar IDs existentes al actualizar sesiones', async () => {
      const updateDto = {
        sessions: [
          {
            sessionId: 'S-123456',
            sessionName: 'Sesión Actualizada',
            date: '2025-01-05',
            exercises: [
              {
                exerciseId: 'E-123456',
                name: 'Press Banca Actualizado',
                sets: 4,
                reps: 8,
              },
            ],
          },
        ],
      };

      mockTrainingPlanModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockTrainingPlan),
      });

      mockTrainingPlanModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue({}),
      });

      await service.update(mockPlanId, updateDto);

      const callArg = mockTrainingPlanModel.findByIdAndUpdate.mock.calls[0][1];
      expect(callArg.sessions[0].sessionId).toBe('S-123456');
      expect(callArg.sessions[0].exercises[0].exerciseId).toBe('E-123456');
    });
  });

  describe('remove', () => {
    it('debe eliminar un plan de entrenamiento', async () => {
      mockTrainingPlanModel.deleteOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ deletedCount: 1 }),
      });

      await service.remove(mockPlanId);

      expect(mockTrainingPlanModel.deleteOne).toHaveBeenCalledWith({ _id: mockPlanId });
    });

    it('debe lanzar NotFoundException si el plan no existe', async () => {
      mockTrainingPlanModel.deleteOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ deletedCount: 0 }),
      });

      await expect(service.remove('id_inexistente')).rejects.toThrow(
        new NotFoundException('Training plan con ID id_inexistente no encontrado')
      );
    });
  });

  describe('submitExerciseFeedback', () => {
    it('debe actualizar el feedback de un ejercicio', async () => {
      const planCopy = JSON.parse(JSON.stringify(mockTrainingPlan));
      planCopy.save = jest.fn().mockResolvedValue(planCopy);
      planCopy.markModified = jest.fn();

      mockTrainingPlanModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(planCopy),
      });

      const feedbackDto = {
        planId: mockPlanId,
        sessionId: 'S-123456',
        exerciseId: 'E-123456',
        completed: true,
        performanceComment: 'Buen rendimiento',
        athleteNotes: 'Me sentí fuerte',
        athleteId: mockAthleteId,
      };

      const result = await service.submitExerciseFeedback(feedbackDto);

      expect(result).toBeDefined();
      expect(planCopy.save).toHaveBeenCalled();
      expect(planCopy.markModified).toHaveBeenCalledWith('sessions');
    });

    it('debe actualizar la mediaUrl si se proporciona', async () => {
      const planCopy = JSON.parse(JSON.stringify(mockTrainingPlan));
      planCopy.save = jest.fn().mockResolvedValue(planCopy);
      planCopy.markModified = jest.fn();

      mockTrainingPlanModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(planCopy),
      });

      const feedbackDto = {
        planId: mockPlanId,
        sessionId: 'S-123456',
        exerciseId: 'E-123456',
        completed: true,
        athleteId: mockAthleteId,
        mediaUrl: 'uploads/video-123.mp4',
      };

      await service.submitExerciseFeedback(feedbackDto);

      expect(planCopy.sessions[0].exercises[0].mediaUrl).toBe('uploads/video-123.mp4');
    });

    it('debe lanzar NotFoundException si el plan no existe', async () => {
      mockTrainingPlanModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      const feedbackDto = {
        planId: 'id_inexistente',
        sessionId: 'S-123456',
        exerciseId: 'E-123456',
        completed: true,
        athleteId: mockAthleteId,
      };

      await expect(service.submitExerciseFeedback(feedbackDto)).rejects.toThrow(
        new NotFoundException('Training plan con ID id_inexistente no encontrado')
      );
    });

    it('debe lanzar error si el atleta no es el propietario del plan', async () => {
      const planCopy = JSON.parse(JSON.stringify(mockTrainingPlan));

      mockTrainingPlanModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(planCopy),
      });

      const feedbackDto = {
        planId: mockPlanId,
        sessionId: 'S-123456',
        exerciseId: 'E-123456',
        completed: true,
        athleteId: 'otro-atleta-id',
      };

      await expect(service.submitExerciseFeedback(feedbackDto)).rejects.toThrow(
        new NotFoundException('No autorizado para actualizar este plan')
      );
    });

    it('debe lanzar NotFoundException si la sesión no existe', async () => {
      const planCopy = JSON.parse(JSON.stringify(mockTrainingPlan));

      mockTrainingPlanModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(planCopy),
      });

      const feedbackDto = {
        planId: mockPlanId,
        sessionId: 'S-INEXISTENTE',
        exerciseId: 'E-123456',
        completed: true,
        athleteId: mockAthleteId,
      };

      await expect(service.submitExerciseFeedback(feedbackDto)).rejects.toThrow(
        new NotFoundException('Sesión no encontrada')
      );
    });

    it('debe lanzar NotFoundException si el ejercicio no existe', async () => {
      const planCopy = JSON.parse(JSON.stringify(mockTrainingPlan));

      mockTrainingPlanModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(planCopy),
      });

      const feedbackDto = {
        planId: mockPlanId,
        sessionId: 'S-123456',
        exerciseId: 'E-INEXISTENTE',
        completed: true,
        athleteId: mockAthleteId,
      };

      await expect(service.submitExerciseFeedback(feedbackDto)).rejects.toThrow(
        new NotFoundException('Ejercicio no encontrado')
      );
    });

    it('debe manejar completed como string "true"', async () => {
      const planCopy = JSON.parse(JSON.stringify(mockTrainingPlan));
      planCopy.save = jest.fn().mockResolvedValue(planCopy);
      planCopy.markModified = jest.fn();

      mockTrainingPlanModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(planCopy),
      });

      const feedbackDto: any = {
        planId: mockPlanId,
        sessionId: 'S-123456',
        exerciseId: 'E-123456',
        completed: 'true',
        athleteId: mockAthleteId,
      };

      await service.submitExerciseFeedback(feedbackDto);

      expect(planCopy.sessions[0].exercises[0].completed).toBe(true);
    });

    it('debe manejar completed como string "false"', async () => {
      const planCopy = JSON.parse(JSON.stringify(mockTrainingPlan));
      planCopy.save = jest.fn().mockResolvedValue(planCopy);
      planCopy.markModified = jest.fn();

      mockTrainingPlanModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(planCopy),
      });

      const feedbackDto: any = {
        planId: mockPlanId,
        sessionId: 'S-123456',
        exerciseId: 'E-123456',
        completed: 'false',
        athleteId: mockAthleteId,
      };

      await service.submitExerciseFeedback(feedbackDto);

      expect(planCopy.sessions[0].exercises[0].completed).toBe(false);
    });
  });

  describe('updateSessionNotes', () => {
    it('debe actualizar las notas de una sesión', async () => {
      const planCopy = JSON.parse(JSON.stringify(mockTrainingPlan));
      planCopy.save = jest.fn().mockResolvedValue(planCopy);
      planCopy.markModified = jest.fn();

      mockTrainingPlanModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(planCopy),
      });

      const notesDto = {
        planId: mockPlanId,
        sessionId: 'S-123456',
        sessionNotes: 'Sesión muy intensa',
        athleteId: mockAthleteId,
      };

      const result = await service.updateSessionNotes(notesDto);

      expect(result).toBeDefined();
      expect(planCopy.sessions[0].sessionNotes).toBe('Sesión muy intensa');
      expect(planCopy.save).toHaveBeenCalled();
    });

    it('debe lanzar NotFoundException si el plan no existe', async () => {
      mockTrainingPlanModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      const notesDto = {
        planId: 'id_inexistente',
        sessionId: 'S-123456',
        sessionNotes: 'Notas',
        athleteId: mockAthleteId,
      };

      await expect(service.updateSessionNotes(notesDto)).rejects.toThrow(
        new NotFoundException('Training plan con ID id_inexistente no encontrado')
      );
    });

    it('debe validar que el atleta sea el propietario del plan', async () => {
      const planCopy = JSON.parse(JSON.stringify(mockTrainingPlan));

      mockTrainingPlanModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(planCopy),
      });

      const notesDto = {
        planId: mockPlanId,
        sessionId: 'S-123456',
        sessionNotes: 'Notas',
        athleteId: 'otro-atleta',
      };

      await expect(service.updateSessionNotes(notesDto)).rejects.toThrow(
        new NotFoundException('No autorizado para actualizar este plan')
      );
    });
  });

  describe('submitPerformedSets', () => {
    it('debe actualizar los sets realizados de un ejercicio', async () => {
      const planCopy = JSON.parse(JSON.stringify(mockTrainingPlan));
      planCopy.save = jest.fn().mockResolvedValue(planCopy);
      planCopy.markModified = jest.fn();

      mockTrainingPlanModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(planCopy),
      });

      const setsDto = {
        planId: mockPlanId,
        sessionId: 'S-123456',
        exerciseId: 'E-123456',
        athleteId: mockAthleteId,
        sets: [
          {
            setId: 'PS-111111',
            completed: true,
            repsPerformed: 10,
            loadUsed: 80,
          },
          {
            setId: 'PS-222222',
            completed: true,
            repsPerformed: 9,
            loadUsed: 80,
          },
        ],
      };

      const result = await service.submitPerformedSets(setsDto);

      expect(result).toBeDefined();
      expect(planCopy.sessions[0].exercises[0].performedSets[0].completed).toBe(true);
      expect(planCopy.sessions[0].exercises[0].performedSets[0].repsPerformed).toBe(10);
      expect(planCopy.save).toHaveBeenCalled();
    });

    it('debe marcar el ejercicio como completado si todos los sets están completados', async () => {
      const planCopy = JSON.parse(JSON.stringify(mockTrainingPlan));
      planCopy.save = jest.fn().mockResolvedValue(planCopy);
      planCopy.markModified = jest.fn();

      mockTrainingPlanModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(planCopy),
      });

      const setsDto = {
        planId: mockPlanId,
        sessionId: 'S-123456',
        exerciseId: 'E-123456',
        athleteId: mockAthleteId,
        sets: [
          { setId: 'PS-111111', completed: true, repsPerformed: 10, loadUsed: 80 },
          { setId: 'PS-222222', completed: true, repsPerformed: 10, loadUsed: 80 },
          { setId: 'PS-333333', completed: true, repsPerformed: 10, loadUsed: 80 },
          { setId: 'PS-444444', completed: true, repsPerformed: 10, loadUsed: 80 },
        ],
      };

      await service.submitPerformedSets(setsDto);

      expect(planCopy.sessions[0].exercises[0].completed).toBe(true);
    });

    it('debe lanzar NotFoundException si el ejercicio no existe', async () => {
      const planCopy = JSON.parse(JSON.stringify(mockTrainingPlan));

      mockTrainingPlanModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(planCopy),
      });

      const setsDto = {
        planId: mockPlanId,
        sessionId: 'S-123456',
        exerciseId: 'E-INEXISTENTE',
        athleteId: mockAthleteId,
        sets: [],
      };

      await expect(service.submitPerformedSets(setsDto)).rejects.toThrow(
        new NotFoundException('Ejercicio no encontrado')
      );
    });
  });

  describe('convertToTemplate', () => {
    it('debe convertir un plan en plantilla', async () => {
      const mockTemplate = {
        _id: mockTemplateId,
        name: 'Plantilla desde Plan',
      };

      mockTemplatesService.createFromTrainingPlan.mockResolvedValue(mockTemplate);

      mockTrainingPlanModel.findByIdAndUpdate.mockResolvedValue(mockTrainingPlan);

      const convertDto = {
        planId: mockPlanId,
        name: 'Plantilla desde Plan',
        description: 'Descripción',
        createdBy: mockCoachId,
      };

      const result = await service.convertToTemplate(convertDto);

      expect(result).toEqual(mockTemplate);
      expect(mockTemplatesService.createFromTrainingPlan).toHaveBeenCalledWith(convertDto);
      expect(mockTrainingPlanModel.findByIdAndUpdate).toHaveBeenCalledWith(
        mockPlanId,
        {
          isTemplate: true,
          templateId: mockTemplateId,
        }
      );
    });
  });

  describe('removeTemplateStatus', () => {
    it('debe quitar el estado de plantilla de un plan', async () => {
      const updatedPlan = { ...mockTrainingPlan, isTemplate: false, templateId: undefined };

      mockTrainingPlanModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(updatedPlan),
      });

      const result = await service.removeTemplateStatus(mockPlanId);

      expect(result).toEqual(updatedPlan);
      expect(mockTrainingPlanModel.findByIdAndUpdate).toHaveBeenCalledWith(
        mockPlanId,
        {
          isTemplate: false,
          $unset: { templateId: 1 },
        },
        { new: true }
      );
    });

    it('debe lanzar NotFoundException si el plan no existe', async () => {
      mockTrainingPlanModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.removeTemplateStatus('id_inexistente')).rejects.toThrow(
        new NotFoundException('Training plan con ID id_inexistente no encontrado')
      );
    });
  });

  describe('generateId', () => {
    it('debe generar IDs con el prefijo correcto', () => {
      const sessionId = service.generateId('S');
      const exerciseId = service.generateId('E');
      const setId = service.generateId('PS');

      expect(sessionId).toMatch(/^S-[A-Z0-9]{6}$/);
      expect(exerciseId).toMatch(/^E-[A-Z0-9]{6}$/);
      expect(setId).toMatch(/^PS-[A-Z0-9]{6}$/);
    });

    it('debe generar IDs únicos', () => {
      const id1 = service.generateId('S');
      const id2 = service.generateId('S');

      expect(id1).not.toBe(id2);
    });
  });
});
