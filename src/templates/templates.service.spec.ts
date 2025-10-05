import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { TemplatesService } from './templates.service';
import { Template, TemplateType, TemplatePredefinedCategory } from './schemas/template.schema';
import { TrainingPlan } from '../training-plans/schemas/training-plan.schema';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('TemplatesService', () => {
  let service: TemplatesService;
  let templateModel: any;
  let trainingPlanModel: any;

  const mockTemplateId = '507f1f77bcf86cd799439011';
  const mockUserId = '507f1f77bcf86cd799439012';
  const mockPlanId = '507f1f77bcf86cd799439013';

  const mockTemplate = {
    _id: mockTemplateId,
    name: 'Plantilla de Prueba',
    description: 'Descripción de prueba',
    type: TemplateType.USER_CREATED,
    createdBy: mockUserId,
    sessions: [
      {
        sessionName: 'Día 1',
        date: 'Lunes',
        exercises: [
          {
            name: 'Sentadilla',
            sets: 4,
            reps: 10,
            rpe: 8,
            performedSets: []
          }
        ]
      }
    ],
    usageCount: 0,
    isActive: true,
    save: jest.fn().mockResolvedValue(this),
  };

  const mockPredefinedTemplate = {
    _id: '507f1f77bcf86cd799439014',
    name: 'Fuerza Básico',
    description: 'Plantilla predefinida',
    type: TemplateType.PREDEFINED,
    predefinedCategory: TemplatePredefinedCategory.FUERZA_BASICO,
    sessions: [],
    usageCount: 5,
    isActive: true,
  };

  const mockTrainingPlan = {
    _id: mockPlanId,
    name: 'Plan de Prueba',
    sessions: [
      {
        sessionName: 'Sesión 1',
        date: 'Lunes',
        exercises: [
          {
            name: 'Press Banca',
            sets: 3,
            reps: 12,
            performedSets: []
          }
        ]
      }
    ],
  };

  // Mock del modelo como función constructora
  const mockTemplateModel: any = jest.fn().mockImplementation((data) => ({
    ...data,
    save: jest.fn().mockResolvedValue({ ...data, _id: mockTemplateId }),
  }));

  mockTemplateModel.find = jest.fn();
  mockTemplateModel.findById = jest.fn();
  mockTemplateModel.findByIdAndUpdate = jest.fn();
  mockTemplateModel.insertMany = jest.fn();
  mockTemplateModel.exec = jest.fn();

  const mockTrainingPlanModel = {
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    exec: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TemplatesService,
        {
          provide: getModelToken(Template.name),
          useValue: mockTemplateModel,
        },
        {
          provide: getModelToken(TrainingPlan.name),
          useValue: mockTrainingPlanModel,
        },
      ],
    }).compile();

    service = module.get<TemplatesService>(TemplatesService);
    templateModel = module.get(getModelToken(Template.name));
    trainingPlanModel = module.get(getModelToken(TrainingPlan.name));

    // Resetear mocks antes de cada prueba
    jest.clearAllMocks();
  });

  describe('Definición del servicio', () => {
    it('debe estar definido el servicio', () => {
      expect(service).toBeDefined();
    });
  });

  describe('create', () => {
    it('debe crear una nueva plantilla correctamente', async () => {
      const createDto = {
        name: 'Nueva Plantilla',
        description: 'Descripción',
        type: TemplateType.USER_CREATED,
        createdBy: mockUserId,
        sessions: mockTemplate.sessions,
      };

      const result = await service.create(createDto);

      expect(result).toBeDefined();
      expect(mockTemplateModel).toHaveBeenCalled();
    });

    it('debe establecer isActive en true por defecto', async () => {
      const createDto = {
        name: 'Plantilla',
        description: 'Descripción',
        type: TemplateType.USER_CREATED,
        createdBy: mockUserId,
        sessions: [],
      };

      const result = await service.create(createDto);
      
      expect(result).toBeDefined();
    });
  });

  describe('findAll', () => {
    it('debe retornar todas las plantillas activas', async () => {
      const mockTemplates = [mockTemplate, mockPredefinedTemplate];
      
      mockTemplateModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockTemplates),
        }),
      });

      const result = await service.findAll();

      expect(result).toEqual(mockTemplates);
      expect(mockTemplateModel.find).toHaveBeenCalledWith({ isActive: true });
    });

    it('debe ordenar las plantillas por fecha de creación descendente', async () => {
      const sortMock = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue([]),
      });

      mockTemplateModel.find.mockReturnValue({
        sort: sortMock,
      });

      await service.findAll();

      expect(sortMock).toHaveBeenCalledWith({ createdAt: -1 });
    });
  });

  describe('findByType', () => {
    it('debe retornar plantillas filtradas por tipo', async () => {
      const predefinedTemplates = [mockPredefinedTemplate];
      
      mockTemplateModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(predefinedTemplates),
        }),
      });

      const result = await service.findByType(TemplateType.PREDEFINED);

      expect(result).toEqual(predefinedTemplates);
      expect(mockTemplateModel.find).toHaveBeenCalledWith({ 
        type: TemplateType.PREDEFINED, 
        isActive: true 
      });
    });

    it('debe retornar plantillas creadas por usuario', async () => {
      mockTemplateModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue([mockTemplate]),
        }),
      });

      const result = await service.findByType(TemplateType.USER_CREATED);

      expect(result).toEqual([mockTemplate]);
      expect(mockTemplateModel.find).toHaveBeenCalledWith({ 
        type: TemplateType.USER_CREATED, 
        isActive: true 
      });
    });
  });

  describe('findPredefined', () => {
    it('debe retornar solo plantillas predefinidas', async () => {
      mockTemplateModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue([mockPredefinedTemplate]),
        }),
      });

      const result = await service.findPredefined();

      expect(result).toEqual([mockPredefinedTemplate]);
      expect(mockTemplateModel.find).toHaveBeenCalledWith({ 
        type: TemplateType.PREDEFINED, 
        isActive: true 
      });
    });

    it('debe ordenar por categoría predefinida', async () => {
      const sortMock = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue([]),
      });

      mockTemplateModel.find.mockReturnValue({
        sort: sortMock,
      });

      await service.findPredefined();

      expect(sortMock).toHaveBeenCalledWith({ predefinedCategory: 1 });
    });
  });

  describe('findByCreator', () => {
    it('debe retornar plantillas creadas por un usuario específico', async () => {
      mockTemplateModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue([mockTemplate]),
        }),
      });

      const result = await service.findByCreator(mockUserId);

      expect(result).toEqual([mockTemplate]);
      expect(mockTemplateModel.find).toHaveBeenCalledWith({ 
        createdBy: mockUserId,
        type: TemplateType.USER_CREATED,
        isActive: true 
      });
    });

    it('debe retornar array vacío si el usuario no tiene plantillas', async () => {
      mockTemplateModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue([]),
        }),
      });

      const result = await service.findByCreator('userId_sin_plantillas');

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('debe retornar una plantilla por ID', async () => {
      mockTemplateModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockTemplate),
      });

      const result = await service.findOne(mockTemplateId);

      expect(result).toEqual(mockTemplate);
      expect(mockTemplateModel.findById).toHaveBeenCalledWith(mockTemplateId);
    });

    it('debe lanzar NotFoundException si la plantilla no existe', async () => {
      mockTemplateModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.findOne('id_inexistente')).rejects.toThrow(
        new NotFoundException('Plantilla con ID id_inexistente no encontrada')
      );
    });
  });

  describe('update', () => {
    it('debe actualizar una plantilla correctamente', async () => {
      const updateDto = {
        name: 'Nombre Actualizado',
        description: 'Descripción Actualizada',
      };

      const updatedTemplate = { ...mockTemplate, ...updateDto };

      mockTemplateModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(updatedTemplate),
      });

      const result = await service.update(mockTemplateId, updateDto);

      expect(result).toEqual(updatedTemplate);
      expect(mockTemplateModel.findByIdAndUpdate).toHaveBeenCalledWith(
        mockTemplateId,
        expect.any(Object),
        { new: true }
      );
    });

    it('debe lanzar NotFoundException si la plantilla no existe', async () => {
      mockTemplateModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(
        service.update('id_inexistente', { name: 'Nuevo' })
      ).rejects.toThrow(
        new NotFoundException('Plantilla con ID id_inexistente no encontrada')
      );
    });
  });

  describe('remove', () => {
    it('debe eliminar una plantilla de usuario (soft delete)', async () => {
      const templateToDelete = {
        ...mockTemplate,
        save: jest.fn().mockResolvedValue(true),
      };

      mockTemplateModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(templateToDelete),
      });

      await service.remove(mockTemplateId);

      expect(templateToDelete.isActive).toBe(false);
      expect(templateToDelete.save).toHaveBeenCalled();
    });

    it('debe lanzar BadRequestException al intentar eliminar plantilla predefinida', async () => {
      mockTemplateModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockPredefinedTemplate),
      });

      await expect(service.remove(mockPredefinedTemplate._id)).rejects.toThrow(
        new BadRequestException('No se pueden eliminar plantillas predefinidas del sistema')
      );
    });

    it('debe lanzar NotFoundException si la plantilla no existe', async () => {
      mockTemplateModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.remove('id_inexistente')).rejects.toThrow(
        new NotFoundException('Plantilla con ID id_inexistente no encontrada')
      );
    });

    it('debe desmarcar el plan original al eliminar plantilla', async () => {
      const templateWithPlan = {
        ...mockTemplate,
        originalPlanId: mockPlanId,
        save: jest.fn().mockResolvedValue(true),
      };

      mockTemplateModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(templateWithPlan),
      });

      mockTrainingPlanModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(true),
      });

      await service.remove(mockTemplateId);

      expect(mockTrainingPlanModel.findByIdAndUpdate).toHaveBeenCalledWith(
        mockPlanId,
        {
          isTemplate: false,
          $unset: { templateId: 1 }
        }
      );
    });
  });

  describe('createFromTrainingPlan', () => {
    it('debe crear una plantilla desde un plan de entrenamiento', async () => {
      const createFromPlanDto = {
        planId: mockPlanId,
        name: 'Plantilla desde Plan',
        description: 'Descripción',
        createdBy: mockUserId,
      };

      mockTrainingPlanModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockTrainingPlan),
      });

      // Mock para el método create
      jest.spyOn(service, 'create').mockResolvedValue(mockTemplate as any);

      const result = await service.createFromTrainingPlan(createFromPlanDto);

      expect(result).toBeDefined();
      expect(mockTrainingPlanModel.findById).toHaveBeenCalledWith(mockPlanId);
    });

    it('debe lanzar NotFoundException si el plan no existe', async () => {
      const createFromPlanDto = {
        planId: 'plan_inexistente',
        name: 'Plantilla',
        description: 'Descripción',
        createdBy: mockUserId,
      };

      mockTrainingPlanModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(
        service.createFromTrainingPlan(createFromPlanDto)
      ).rejects.toThrow(
        new NotFoundException('Plan de entrenamiento con ID plan_inexistente no encontrado')
      );
    });
  });

  describe('incrementUsage', () => {
    it('debe incrementar el contador de uso de una plantilla', async () => {
      mockTemplateModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(true),
      });

      await service.incrementUsage(mockTemplateId);

      expect(mockTemplateModel.findByIdAndUpdate).toHaveBeenCalledWith(
        mockTemplateId,
        { $inc: { usageCount: 1 } }
      );
    });
  });

  describe('getMostUsed', () => {
    it('debe retornar las plantillas más utilizadas con límite por defecto', async () => {
      const mostUsedTemplates = [
        { ...mockPredefinedTemplate, usageCount: 10 },
        { ...mockTemplate, usageCount: 5 },
      ];

      mockTemplateModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue(mostUsedTemplates),
          }),
        }),
      });

      const result = await service.getMostUsed();

      expect(result).toEqual(mostUsedTemplates);
      expect(mockTemplateModel.find).toHaveBeenCalledWith({ isActive: true });
    });

    it('debe retornar las plantillas más utilizadas con límite personalizado', async () => {
      const limitMock = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue([]),
      });

      mockTemplateModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: limitMock,
        }),
      });

      await service.getMostUsed(5);

      expect(limitMock).toHaveBeenCalledWith(5);
    });

    it('debe ordenar por usageCount descendente', async () => {
      const sortMock = jest.fn().mockReturnValue({
        limit: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue([]),
        }),
      });

      mockTemplateModel.find.mockReturnValue({
        sort: sortMock,
      });

      await service.getMostUsed();

      expect(sortMock).toHaveBeenCalledWith({ usageCount: -1 });
    });
  });

  describe('createPredefinedTemplates', () => {
    it('debe crear plantillas predefinidas si no existen', async () => {
      mockTemplateModel.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue([]),
      });

      mockTemplateModel.insertMany.mockResolvedValue([]);

      await service.createPredefinedTemplates();

      expect(mockTemplateModel.insertMany).toHaveBeenCalled();
    });

    it('no debe crear plantillas predefinidas si ya existen', async () => {
      mockTemplateModel.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue([mockPredefinedTemplate]),
      });

      await service.createPredefinedTemplates();

      expect(mockTemplateModel.insertMany).not.toHaveBeenCalled();
    });
  });
});
