import { Test, TestingModule } from '@nestjs/testing';
import { TemplatesController } from './templates.controller';
import { TemplatesService } from './templates.service';
import { TemplateType, TemplatePredefinedCategory } from './schemas/template.schema';

describe('TemplatesController', () => {
  let controller: TemplatesController;
  let service: TemplatesService;

  const mockTemplateId = '507f1f77bcf86cd799439011';
  const mockUserId = '507f1f77bcf86cd799439012';

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

  const mockTemplatesService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findByType: jest.fn(),
    findPredefined: jest.fn(),
    findByCreator: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    createFromTrainingPlan: jest.fn(),
    incrementUsage: jest.fn(),
    getMostUsed: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TemplatesController],
      providers: [
        {
          provide: TemplatesService,
          useValue: mockTemplatesService,
        },
      ],
    }).compile();

    controller = module.get<TemplatesController>(TemplatesController);
    service = module.get<TemplatesService>(TemplatesService);

    // Resetear mocks antes de cada prueba
    jest.clearAllMocks();
  });

  describe('Definición del controlador', () => {
    it('debe estar definido el controlador', () => {
      expect(controller).toBeDefined();
    });
  });

  describe('POST /templates', () => {
    it('debe crear una nueva plantilla', async () => {
      const createDto = {
        name: 'Nueva Plantilla',
        description: 'Descripción',
        type: TemplateType.USER_CREATED,
        createdBy: mockUserId,
        sessions: mockTemplate.sessions,
      };

      mockTemplatesService.create.mockResolvedValue(mockTemplate);

      const result = await controller.create(createDto);

      expect(result).toEqual(mockTemplate);
      expect(service.create).toHaveBeenCalledWith(createDto);
    });

    it('debe crear una plantilla con todas las propiedades', async () => {
      const createDto = {
        name: 'Plantilla Completa',
        description: 'Descripción completa',
        type: TemplateType.USER_CREATED,
        createdBy: mockUserId,
        sessions: [],
        isActive: true,
      };

      mockTemplatesService.create.mockResolvedValue({ ...mockTemplate, ...createDto });

      const result = await controller.create(createDto);

      expect(result).toBeDefined();
      expect(service.create).toHaveBeenCalledWith(createDto);
    });
  });

  describe('POST /templates/from-plan', () => {
    it('debe crear una plantilla desde un plan de entrenamiento', async () => {
      const createFromPlanDto = {
        planId: '507f1f77bcf86cd799439013',
        name: 'Plantilla desde Plan',
        description: 'Descripción',
        createdBy: mockUserId,
      };

      mockTemplatesService.createFromTrainingPlan.mockResolvedValue(mockTemplate);

      const result = await controller.createFromPlan(createFromPlanDto);

      expect(result).toEqual(mockTemplate);
      expect(service.createFromTrainingPlan).toHaveBeenCalledWith(createFromPlanDto);
    });
  });

  describe('GET /templates', () => {
    it('debe retornar todas las plantillas sin filtros', async () => {
      const mockTemplates = [mockTemplate, mockPredefinedTemplate];
      mockTemplatesService.findAll.mockResolvedValue(mockTemplates);

      const result = await controller.findAll();

      expect(result).toEqual(mockTemplates);
      expect(service.findAll).toHaveBeenCalled();
    });

    it('debe retornar plantillas predefinidas cuando predefined=true', async () => {
      mockTemplatesService.findPredefined.mockResolvedValue([mockPredefinedTemplate]);

      const result = await controller.findAll(undefined, undefined, 'true');

      expect(result).toEqual([mockPredefinedTemplate]);
      expect(service.findPredefined).toHaveBeenCalled();
    });

    it('debe retornar plantillas filtradas por tipo', async () => {
      mockTemplatesService.findByType.mockResolvedValue([mockTemplate]);

      const result = await controller.findAll(TemplateType.USER_CREATED);

      expect(result).toEqual([mockTemplate]);
      expect(service.findByType).toHaveBeenCalledWith(TemplateType.USER_CREATED);
    });

    it('debe retornar plantillas filtradas por creador', async () => {
      mockTemplatesService.findByCreator.mockResolvedValue([mockTemplate]);

      const result = await controller.findAll(undefined, mockUserId);

      expect(result).toEqual([mockTemplate]);
      expect(service.findByCreator).toHaveBeenCalledWith(mockUserId);
    });

    it('debe priorizar predefined sobre otros filtros', async () => {
      mockTemplatesService.findPredefined.mockResolvedValue([mockPredefinedTemplate]);

      const result = await controller.findAll(
        TemplateType.USER_CREATED, 
        mockUserId, 
        'true'
      );

      expect(result).toEqual([mockPredefinedTemplate]);
      expect(service.findPredefined).toHaveBeenCalled();
      expect(service.findByType).not.toHaveBeenCalled();
      expect(service.findByCreator).not.toHaveBeenCalled();
    });
  });

  describe('GET /templates/most-used', () => {
    it('debe retornar las plantillas más utilizadas con límite por defecto', async () => {
      const mostUsedTemplates = [
        { ...mockPredefinedTemplate, usageCount: 10 },
        { ...mockTemplate, usageCount: 5 },
      ];

      mockTemplatesService.getMostUsed.mockResolvedValue(mostUsedTemplates);

      const result = await controller.getMostUsed();

      expect(result).toEqual(mostUsedTemplates);
      expect(service.getMostUsed).toHaveBeenCalledWith(10);
    });

    it('debe retornar las plantillas más utilizadas con límite personalizado', async () => {
      mockTemplatesService.getMostUsed.mockResolvedValue([mockPredefinedTemplate]);

      const result = await controller.getMostUsed('5');

      expect(result).toEqual([mockPredefinedTemplate]);
      expect(service.getMostUsed).toHaveBeenCalledWith(5);
    });

    it('debe manejar límites como string y convertirlos a número', async () => {
      mockTemplatesService.getMostUsed.mockResolvedValue([]);

      await controller.getMostUsed('15');

      expect(service.getMostUsed).toHaveBeenCalledWith(15);
    });
  });

  describe('GET /templates/predefined', () => {
    it('debe retornar solo plantillas predefinidas', async () => {
      mockTemplatesService.findPredefined.mockResolvedValue([mockPredefinedTemplate]);

      const result = await controller.findPredefined();

      expect(result).toEqual([mockPredefinedTemplate]);
      expect(service.findPredefined).toHaveBeenCalled();
    });
  });

  describe('GET /templates/by-type/:type', () => {
    it('debe retornar plantillas filtradas por tipo PREDEFINED', async () => {
      mockTemplatesService.findByType.mockResolvedValue([mockPredefinedTemplate]);

      const result = await controller.findByType(TemplateType.PREDEFINED);

      expect(result).toEqual([mockPredefinedTemplate]);
      expect(service.findByType).toHaveBeenCalledWith(TemplateType.PREDEFINED);
    });

    it('debe retornar plantillas filtradas por tipo USER_CREATED', async () => {
      mockTemplatesService.findByType.mockResolvedValue([mockTemplate]);

      const result = await controller.findByType(TemplateType.USER_CREATED);

      expect(result).toEqual([mockTemplate]);
      expect(service.findByType).toHaveBeenCalledWith(TemplateType.USER_CREATED);
    });
  });

  describe('GET /templates/by-creator/:createdBy', () => {
    it('debe retornar plantillas creadas por un usuario específico', async () => {
      mockTemplatesService.findByCreator.mockResolvedValue([mockTemplate]);

      const result = await controller.findByCreator(mockUserId);

      expect(result).toEqual([mockTemplate]);
      expect(service.findByCreator).toHaveBeenCalledWith(mockUserId);
    });

    it('debe retornar array vacío si el usuario no tiene plantillas', async () => {
      mockTemplatesService.findByCreator.mockResolvedValue([]);

      const result = await controller.findByCreator('userId_sin_plantillas');

      expect(result).toEqual([]);
    });
  });

  describe('GET /templates/:id', () => {
    it('debe retornar una plantilla por ID', async () => {
      mockTemplatesService.findOne.mockResolvedValue(mockTemplate);

      const result = await controller.findOne(mockTemplateId);

      expect(result).toEqual(mockTemplate);
      expect(service.findOne).toHaveBeenCalledWith(mockTemplateId);
    });
  });

  describe('PATCH /templates/:id', () => {
    it('debe actualizar una plantilla correctamente', async () => {
      const updateDto = {
        name: 'Nombre Actualizado',
        description: 'Descripción Actualizada',
      };

      const updatedTemplate = { ...mockTemplate, ...updateDto };
      mockTemplatesService.update.mockResolvedValue(updatedTemplate);

      const result = await controller.update(mockTemplateId, updateDto);

      expect(result).toEqual(updatedTemplate);
      expect(service.update).toHaveBeenCalledWith(mockTemplateId, updateDto);
    });

    it('debe actualizar parcialmente una plantilla', async () => {
      const updateDto = { name: 'Solo Nombre' };

      const updatedTemplate = { ...mockTemplate, name: 'Solo Nombre' };
      mockTemplatesService.update.mockResolvedValue(updatedTemplate);

      const result = await controller.update(mockTemplateId, updateDto);

      expect(result).toEqual(updatedTemplate);
      expect(service.update).toHaveBeenCalledWith(mockTemplateId, updateDto);
    });
  });

  describe('PATCH /templates/:id/increment-usage', () => {
    it('debe incrementar el contador de uso de una plantilla', async () => {
      mockTemplatesService.incrementUsage.mockResolvedValue(undefined);

      const result = await controller.incrementUsage(mockTemplateId);

      expect(result).toBeUndefined();
      expect(service.incrementUsage).toHaveBeenCalledWith(mockTemplateId);
    });
  });

  describe('DELETE /templates/:id', () => {
    it('debe eliminar una plantilla (soft delete)', async () => {
      mockTemplatesService.remove.mockResolvedValue(undefined);

      const result = await controller.remove(mockTemplateId);

      expect(result).toBeUndefined();
      expect(service.remove).toHaveBeenCalledWith(mockTemplateId);
    });

    it('debe pasar el ID correcto al servicio', async () => {
      const customId = '507f1f77bcf86cd799439099';
      mockTemplatesService.remove.mockResolvedValue(undefined);

      await controller.remove(customId);

      expect(service.remove).toHaveBeenCalledWith(customId);
    });
  });
});
