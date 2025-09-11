import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Template, TemplateDocument, TemplateType, TemplatePredefinedCategory } from './schemas/template.schema';
import { TrainingPlan, TrainingPlanDocument } from '../training-plans/schemas/training-plan.schema';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';
import { CreateTemplateFromPlanDto } from './dto/create-template-from-plan.dto';

@Injectable()
export class TemplatesService {
  constructor(
    @InjectModel(Template.name)
    private templateModel: Model<TemplateDocument>,
    @InjectModel(TrainingPlan.name)
    private trainingPlanModel: Model<TrainingPlanDocument>,
  ) {}

  // Crear una nueva plantilla
  async create(createTemplateDto: CreateTemplateDto): Promise<Template> {
    const createdTemplate = new this.templateModel({
      ...createTemplateDto,
      usageCount: 0,
      isActive: createTemplateDto.isActive ?? true
    });
    return createdTemplate.save();
  }

  // Obtener todas las plantillas activas
  async findAll(): Promise<Template[]> {
    return this.templateModel
      .find({ isActive: true })
      .sort({ createdAt: -1 })
      .exec();
  }

  // Obtener plantillas por tipo
  async findByType(type: TemplateType): Promise<Template[]> {
    return this.templateModel
      .find({ type, isActive: true })
      .sort({ createdAt: -1 })
      .exec();
  }

  // Obtener plantillas predefinidas
  async findPredefined(): Promise<Template[]> {
    return this.templateModel
      .find({ 
        type: TemplateType.PREDEFINED, 
        isActive: true 
      })
      .sort({ predefinedCategory: 1 })
      .exec();
  }

  // Obtener plantillas creadas por un usuario específico
  async findByCreator(createdBy: string): Promise<Template[]> {
    return this.templateModel
      .find({ 
        createdBy, 
        type: TemplateType.USER_CREATED,
        isActive: true 
      })
      .sort({ createdAt: -1 })
      .exec();
  }

  // Obtener una plantilla por ID
  async findOne(id: string): Promise<Template> {
    const template = await this.templateModel
      .findById(id)
      .exec();
    
    if (!template) {
      throw new NotFoundException(`Plantilla con ID ${id} no encontrada`);
    }
    
    return template;
  }

  // Actualizar una plantilla
  async update(id: string, updateTemplateDto: UpdateTemplateDto): Promise<Template> {
    const updatedTemplate = await this.templateModel
      .findByIdAndUpdate(id, updateTemplateDto, { new: true })
      .exec();
    
    if (!updatedTemplate) {
      throw new NotFoundException(`Plantilla con ID ${id} no encontrada`);
    }
    
    return updatedTemplate;
  }

  // Eliminar una plantilla (soft delete)
  async remove(id: string): Promise<void> {
    const template = await this.templateModel.findById(id).exec();
    
    if (!template) {
      throw new NotFoundException(`Plantilla con ID ${id} no encontrada`);
    }

    // No permitir eliminar plantillas predefinidas
    if (template.type === TemplateType.PREDEFINED) {
      throw new BadRequestException('No se pueden eliminar plantillas predefinidas del sistema');
    }

    // Si la plantilla tiene un plan original asociado, desmarcar el plan como plantilla
    if (template.originalPlanId) {
      try {
        await this.trainingPlanModel.findByIdAndUpdate(
          template.originalPlanId,
          {
            isTemplate: false,
            $unset: { templateId: 1 }
          }
        ).exec();
      } catch (error) {
        // Log del error pero no fallar la eliminación de la plantilla
        console.error(`Error al desmarcar plan ${template.originalPlanId} como plantilla:`, error);
      }
    }

    template.isActive = false;
    await template.save();
  }

  // Crear plantilla desde un plan de entrenamiento existente
  async createFromTrainingPlan(createTemplateFromPlanDto: CreateTemplateFromPlanDto): Promise<Template> {
    const { planId, name, description, createdBy } = createTemplateFromPlanDto;

    // Verificar que el plan existe
    const trainingPlan = await this.trainingPlanModel.findById(planId).exec();
    if (!trainingPlan) {
      throw new NotFoundException(`Plan de entrenamiento con ID ${planId} no encontrado`);
    }

    // Crear la plantilla basada en el plan
    const templateData: CreateTemplateDto = {
      name,
      description,
      type: TemplateType.USER_CREATED,
      createdBy,
      originalPlanId: planId,
      sessions: trainingPlan.sessions,
      isActive: true
    };

    return this.create(templateData);
  }

  // Incrementar contador de uso
  async incrementUsage(id: string): Promise<void> {
    await this.templateModel
      .findByIdAndUpdate(id, { $inc: { usageCount: 1 } })
      .exec();
  }

  // Obtener plantillas más utilizadas
  async getMostUsed(limit: number = 10): Promise<Template[]> {
    return this.templateModel
      .find({ isActive: true })
      .sort({ usageCount: -1 })
      .limit(limit)
      .exec();
  }

  // Método para crear las plantillas predefinidas (se ejecutará en el módulo)
  async createPredefinedTemplates(): Promise<void> {
    // Verificar si ya existen plantillas predefinidas
    const existingTemplates = await this.templateModel
      .find({ type: TemplateType.PREDEFINED })
      .exec();

    if (existingTemplates.length > 0) {
      return; // Ya existen plantillas predefinidas
    }

    const predefinedTemplates = [
      {
        name: 'Fuerza Básico',
        description: 'Plantilla básica para desarrollo de fuerza con ejercicios compuestos fundamentales',
        type: TemplateType.PREDEFINED,
        predefinedCategory: TemplatePredefinedCategory.FUERZA_BASICO,
        sessions: [
          {
            sessionName: 'Día 1 - Tren Superior',
            date: 'Lunes',
            exercises: [
              {
                name: 'Press de Banca',
                sets: 4,
                reps: 5,
                rpe: 8,
                performedSets: Array.from({length: 4}, (_, i) => ({
                  setNumber: i + 1,
                  repsPerformed: null,
                  loadUsed: null,
                  measureAchieved: null,
                  notes: null
                }))
              },
              {
                name: 'Remo con Barra',
                sets: 4,
                reps: 5,
                rpe: 8,
                performedSets: Array.from({length: 4}, (_, i) => ({
                  setNumber: i + 1,
                  repsPerformed: null,
                  loadUsed: null,
                  measureAchieved: null,
                  notes: null
                }))
              },
              {
                name: 'Press Militar',
                sets: 3,
                reps: 8,
                rpe: 7,
                performedSets: Array.from({length: 3}, (_, i) => ({
                  setNumber: i + 1,
                  repsPerformed: null,
                  loadUsed: null,
                  measureAchieved: null,
                  notes: null
                }))
              }
            ]
          },
          {
            sessionName: 'Día 2 - Tren Inferior',
            date: 'Miércoles',
            exercises: [
              {
                name: 'Sentadilla',
                sets: 4,
                reps: 5,
                rpe: 8,
                performedSets: Array.from({length: 4}, (_, i) => ({
                  setNumber: i + 1,
                  repsPerformed: null,
                  loadUsed: null,
                  measureAchieved: null,
                  notes: null
                }))
              },
              {
                name: 'Peso Muerto',
                sets: 3,
                reps: 5,
                rpe: 8,
                performedSets: Array.from({length: 3}, (_, i) => ({
                  setNumber: i + 1,
                  repsPerformed: null,
                  loadUsed: null,
                  measureAchieved: null,
                  notes: null
                }))
              },
              {
                name: 'Prensa de Piernas',
                sets: 3,
                reps: 10,
                rpe: 7,
                performedSets: Array.from({length: 3}, (_, i) => ({
                  setNumber: i + 1,
                  repsPerformed: null,
                  loadUsed: null,
                  measureAchieved: null,
                  notes: null
                }))
              }
            ]
          }
        ]
      },
      {
        name: 'Hipertrofia',
        description: 'Plantilla orientada al crecimiento muscular con mayor volumen de entrenamiento',
        type: TemplateType.PREDEFINED,
        predefinedCategory: TemplatePredefinedCategory.HIPERTROFIA,
        sessions: [
          {
            sessionName: 'Día 1 - Pecho y Tríceps',
            date: 'Lunes',
            exercises: [
              {
                name: 'Press de Banca',
                sets: 4,
                reps: 10,
                rpe: 7,
                performedSets: Array.from({length: 4}, (_, i) => ({
                  setNumber: i + 1,
                  repsPerformed: null,
                  loadUsed: null,
                  measureAchieved: null,
                  notes: null
                }))
              },
              {
                name: 'Press Inclinado con Mancuernas',
                sets: 3,
                reps: 12,
                rpe: 7,
                performedSets: Array.from({length: 3}, (_, i) => ({
                  setNumber: i + 1,
                  repsPerformed: null,
                  loadUsed: null,
                  measureAchieved: null,
                  notes: null
                }))
              },
              {
                name: 'Fondos en Paralelas',
                sets: 3,
                reps: 12,
                rpe: 8,
                performedSets: Array.from({length: 3}, (_, i) => ({
                  setNumber: i + 1,
                  repsPerformed: null,
                  loadUsed: null,
                  measureAchieved: null,
                  notes: null
                }))
              },
              {
                name: 'Extensión de Tríceps',
                sets: 3,
                reps: 15,
                rpe: 7,
                performedSets: Array.from({length: 3}, (_, i) => ({
                  setNumber: i + 1,
                  repsPerformed: null,
                  loadUsed: null,
                  measureAchieved: null,
                  notes: null
                }))
              }
            ]
          },
          {
            sessionName: 'Día 2 - Espalda y Bíceps',
            date: 'Martes',
            exercises: [
              {
                name: 'Dominadas',
                sets: 4,
                reps: 8,
                rpe: 8,
                performedSets: Array.from({length: 4}, (_, i) => ({
                  setNumber: i + 1,
                  repsPerformed: null,
                  loadUsed: null,
                  measureAchieved: null,
                  notes: null
                }))
              },
              {
                name: 'Remo con Mancuernas',
                sets: 4,
                reps: 12,
                rpe: 7,
                performedSets: Array.from({length: 4}, (_, i) => ({
                  setNumber: i + 1,
                  repsPerformed: null,
                  loadUsed: null,
                  measureAchieved: null,
                  notes: null
                }))
              },
              {
                name: 'Curl de Bíceps con Barra',
                sets: 3,
                reps: 12,
                rpe: 7,
                performedSets: Array.from({length: 3}, (_, i) => ({
                  setNumber: i + 1,
                  repsPerformed: null,
                  loadUsed: null,
                  measureAchieved: null,
                  notes: null
                }))
              }
            ]
          },
          {
            sessionName: 'Día 3 - Piernas',
            date: 'Jueves',
            exercises: [
              {
                name: 'Sentadilla',
                sets: 4,
                reps: 12,
                rpe: 7,
                performedSets: Array.from({length: 4}, (_, i) => ({
                  setNumber: i + 1,
                  repsPerformed: null,
                  loadUsed: null,
                  measureAchieved: null,
                  notes: null
                }))
              },
              {
                name: 'Peso Muerto Rumano',
                sets: 3,
                reps: 12,
                rpe: 7,
                performedSets: Array.from({length: 3}, (_, i) => ({
                  setNumber: i + 1,
                  repsPerformed: null,
                  loadUsed: null,
                  measureAchieved: null,
                  notes: null
                }))
              },
              {
                name: 'Extensión de Cuádriceps',
                sets: 3,
                reps: 15,
                rpe: 7,
                performedSets: Array.from({length: 3}, (_, i) => ({
                  setNumber: i + 1,
                  repsPerformed: null,
                  loadUsed: null,
                  measureAchieved: null,
                  notes: null
                }))
              }
            ]
          }
        ]
      },
      {
        name: 'Resistencia',
        description: 'Plantilla enfocada en el desarrollo de la resistencia cardiovascular y muscular',
        type: TemplateType.PREDEFINED,
        predefinedCategory: TemplatePredefinedCategory.RESISTENCIA,
        sessions: [
          {
            sessionName: 'Día 1 - Circuito Full Body',
            date: 'Lunes',
            exercises: [
              {
                name: 'Burpees',
                sets: 3,
                reps: 15,
                rpe: 7,
                performedSets: Array.from({length: 3}, (_, i) => ({
                  setNumber: i + 1,
                  repsPerformed: null,
                  loadUsed: null,
                  measureAchieved: null,
                  notes: null
                }))
              },
              {
                name: 'Mountain Climbers',
                sets: 3,
                reps: 20,
                rpe: 7,
                performedSets: Array.from({length: 3}, (_, i) => ({
                  setNumber: i + 1,
                  repsPerformed: null,
                  loadUsed: null,
                  measureAchieved: null,
                  notes: null
                }))
              },
              {
                name: 'Sentadillas con Salto',
                sets: 3,
                reps: 15,
                rpe: 7,
                performedSets: Array.from({length: 3}, (_, i) => ({
                  setNumber: i + 1,
                  repsPerformed: null,
                  loadUsed: null,
                  measureAchieved: null,
                  notes: null
                }))
              }
            ]
          },
          {
            sessionName: 'Día 2 - Cardio Interválico',
            date: 'Miércoles',
            exercises: [
              {
                name: 'Sprints en Cinta',
                sets: 8,
                reps: 1,
                notes: '30 segundos trabajo, 90 segundos descanso',
                performedSets: Array.from({length: 8}, (_, i) => ({
                  setNumber: i + 1,
                  repsPerformed: null,
                  loadUsed: null,
                  measureAchieved: null,
                  notes: null
                }))
              },
              {
                name: 'Remo en Máquina',
                sets: 4,
                reps: 1,
                notes: '2 minutos trabajo, 1 minuto descanso',
                performedSets: Array.from({length: 4}, (_, i) => ({
                  setNumber: i + 1,
                  repsPerformed: null,
                  loadUsed: null,
                  measureAchieved: null,
                  notes: null
                }))
              }
            ]
          },
          {
            sessionName: 'Día 3 - Resistencia Muscular',
            date: 'Viernes',
            exercises: [
              {
                name: 'Sentadillas',
                sets: 3,
                reps: 25,
                rpe: 6,
                performedSets: Array.from({length: 3}, (_, i) => ({
                  setNumber: i + 1,
                  repsPerformed: null,
                  loadUsed: null,
                  measureAchieved: null,
                  notes: null
                }))
              },
              {
                name: 'Flexiones',
                sets: 3,
                reps: 20,
                rpe: 6,
                performedSets: Array.from({length: 3}, (_, i) => ({
                  setNumber: i + 1,
                  repsPerformed: null,
                  loadUsed: null,
                  measureAchieved: null,
                  notes: null
                }))
              },
              {
                name: 'Plancha',
                sets: 3,
                reps: 1,
                notes: 'Mantener 60 segundos',
                performedSets: Array.from({length: 3}, (_, i) => ({
                  setNumber: i + 1,
                  repsPerformed: null,
                  loadUsed: null,
                  measureAchieved: null,
                  notes: null
                }))
              }
            ]
          }
        ]
      }
    ];

    // Crear las plantillas predefinidas
    await this.templateModel.insertMany(predefinedTemplates);
  }
}
