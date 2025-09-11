import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TrainingPlan, TrainingPlanDocument } from './schemas/training-plan.schema';
import { CreateTrainingPlanDto } from './dto/create-training-plan.dto';
import { UpdateTrainingPlanDto } from './dto/update-training-plan.dto';
import { TemplatesService } from '../templates/templates.service';
import { CreateTemplateFromPlanDto } from '../templates/dto/create-template-from-plan.dto';
import { SubmitExerciseFeedbackDto } from './dto/submit-exercise-feedback.dto';
import { UpdateSessionNotesDto } from './dto/update-session-notes.dto';

@Injectable()
export class TrainingPlansService {
  constructor(
    @InjectModel(TrainingPlan.name)
    private trainingPlanModel: Model<TrainingPlanDocument>,
    private templatesService: TemplatesService,
  ) {}

  async create(createTrainingPlanDto: CreateTrainingPlanDto): Promise<TrainingPlan> {
    // Asignar ids a sesiones/ejercicios/sets y normalizar weight
    const planWithIds = {
      ...createTrainingPlanDto,
      sessions: (createTrainingPlanDto.sessions || []).map((s: any) => ({
        sessionId: s.sessionId || this.generateId('S'),
        sessionName: s.sessionName,
        date: s.date,
        sessionNotes: s.sessionNotes ?? null,
        exercises: (s.exercises || []).map((e: any) => ({
          exerciseId: e.exerciseId || this.generateId('E'),
          name: e.name,
          sets: e.sets,
          reps: e.reps,
          rpe: e.rpe ?? null,
          rir: e.rir ?? null,
          rm: e.rm ?? null,
          notes: e.notes ?? null,
          weight: e.weight ?? null,
          completed: e.completed ?? false,
          performanceComment: e.performanceComment ?? null,
          mediaUrl: e.mediaUrl ?? null,
          athleteNotes: e.athleteNotes ?? null,
          performedSets: (e.performedSets || []).map((ps: any, idx: number) => ({
            setId: ps.setId || this.generateId('PS'),
            setNumber: ps.setNumber ?? idx + 1,
            repsPerformed: ps.repsPerformed ?? null,
            loadUsed: ps.loadUsed ?? null,
            measureAchieved: ps.measureAchieved ?? null,
          })),
        })),
      })),
    } as any;

    const createdPlan = new this.trainingPlanModel(planWithIds);
    return createdPlan.save();
  }

  async findAll(): Promise<TrainingPlan[]> {
    return this.trainingPlanModel
      .find()
      .populate('athleteId', 'fullName email')
      .exec();
  }

  async submitExerciseFeedback(params: SubmitExerciseFeedbackDto & { athleteId: string; mediaUrl?: string }): Promise<TrainingPlan> {
    const { planId, sessionId, exerciseId, completed, performanceComment, athleteNotes, athleteId, mediaUrl } = params;

    const plan = await this.trainingPlanModel.findById(planId).exec();
    if (!plan) throw new NotFoundException(`Training plan with ID ${planId} not found`);

    if (String(plan.athleteId) !== String(athleteId)) {
      throw new NotFoundException('No autorizado para actualizar este plan');
    }

    // Buscar sesión y ejercicio por índices o ids lógicos
    const sessionIndex = plan.sessions.findIndex((s: any) => String((s as any)._id ?? s.sessionId ?? '') === String(sessionId));
    if (sessionIndex === -1) throw new NotFoundException('Sesión no encontrada');

    const exerciseIndex = (plan.sessions[sessionIndex].exercises as any[]).findIndex((e: any) => String((e as any)._id ?? e.exerciseId ?? '') === String(exerciseId));
    if (exerciseIndex === -1) throw new NotFoundException('Ejercicio no encontrado');

    const exercise: any = plan.sessions[sessionIndex].exercises[exerciseIndex];
    if (typeof completed === 'boolean') exercise.completed = completed;
    if (typeof performanceComment === 'string') exercise.performanceComment = performanceComment;
    if (typeof athleteNotes === 'string') exercise.athleteNotes = athleteNotes;
    if (mediaUrl) exercise.mediaUrl = mediaUrl;

    await plan.save();
    return plan;
  }

  async updateSessionNotes(params: UpdateSessionNotesDto & { athleteId: string }): Promise<TrainingPlan> {
    const { planId, sessionId, sessionNotes, athleteId } = params;
    const plan = await this.trainingPlanModel.findById(planId).exec();
    if (!plan) throw new NotFoundException(`Training plan with ID ${planId} not found`);

    if (String(plan.athleteId) !== String(athleteId)) {
      throw new NotFoundException('No autorizado para actualizar este plan');
    }

    const sessionIndex = plan.sessions.findIndex((s: any) => String((s as any)._id ?? s.sessionId ?? '') === String(sessionId));
    if (sessionIndex === -1) throw new NotFoundException('Sesión no encontrada');

    (plan.sessions[sessionIndex] as any).sessionNotes = sessionNotes ?? null;

    await plan.save();
    return plan;
  }

  async findOne(id: string): Promise<TrainingPlan> {
    const plan = await this.trainingPlanModel
      .findById(id)
      .populate('athleteId', 'fullName email')
      .exec();
    if (!plan) {
      throw new NotFoundException(`Training plan with ID ${id} not found`);
    }
    return plan;
  }

  async findByAthleteId(athleteId: string): Promise<TrainingPlan[]> {
    return this.trainingPlanModel
      .find({ athleteId })
      .populate('athleteId', 'fullName email')
      .exec();
  }

  async findByCoachId(coachId: string): Promise<TrainingPlan[]> {
    return this.trainingPlanModel
      .find({ coachId })
      .populate('athleteId', 'fullName email')
      .exec();
  }

  async findByCoachAndAthlete(coachId: string, athleteId: string): Promise<TrainingPlan[]> {
    return this.trainingPlanModel
      .find({ coachId, athleteId })
      .populate('athleteId', 'fullName email')
      .exec();
  }

  async update(id: string, updateTrainingPlanDto: UpdateTrainingPlanDto): Promise<TrainingPlan> {
    // En updates, completar ids faltantes y weight si no está
    const withIds = {
      ...updateTrainingPlanDto,
      sessions: (updateTrainingPlanDto.sessions || []).map((s: any) => ({
        sessionId: s.sessionId || this.generateId('S'),
        sessionName: s.sessionName,
        date: s.date,
        sessionNotes: s.sessionNotes ?? null,
        exercises: (s.exercises || []).map((e: any) => ({
          exerciseId: e.exerciseId || this.generateId('E'),
          name: e.name,
          sets: e.sets,
          reps: e.reps,
          rpe: e.rpe ?? null,
          rir: e.rir ?? null,
          rm: e.rm ?? null,
          notes: e.notes ?? null,
          weight: e.weight ?? null,
          completed: e.completed ?? false,
          performanceComment: e.performanceComment ?? null,
          mediaUrl: e.mediaUrl ?? null,
          athleteNotes: e.athleteNotes ?? null,
          performedSets: (e.performedSets || []).map((ps: any, idx: number) => ({
            setId: ps.setId || this.generateId('PS'),
            setNumber: ps.setNumber ?? idx + 1,
            repsPerformed: ps.repsPerformed ?? null,
            loadUsed: ps.loadUsed ?? null,
            measureAchieved: ps.measureAchieved ?? null,
          })),
        })),
      })),
    } as any;

    const updatedPlan = await this.trainingPlanModel
      .findByIdAndUpdate(id, withIds, { new: true })
      .exec();
    if (!updatedPlan) {
      throw new NotFoundException(`Training plan with ID ${id} not found`);
    }
    return updatedPlan;
  }

  async remove(id: string): Promise<void> {
    const result = await this.trainingPlanModel.deleteOne({ _id: id }).exec();
    if (result.deletedCount === 0) {
      throw new NotFoundException(`Training plan with ID ${id} not found`);
    }
  }

  // Convertir un plan de entrenamiento en plantilla
  async convertToTemplate(createTemplateFromPlanDto: CreateTemplateFromPlanDto) {
    const template = await this.templatesService.createFromTrainingPlan(createTemplateFromPlanDto);
    
    // Marcar el plan como convertido en plantilla
    await this.trainingPlanModel.findByIdAndUpdate(
      createTemplateFromPlanDto.planId,
      { 
        isTemplate: true,
        templateId: (template as any)._id 
      }
    );
    
    return template;
  }

  // Desmarcar plan como plantilla
  async removeTemplateStatus(id: string): Promise<TrainingPlan> {
    const updatedPlan = await this.trainingPlanModel
      .findByIdAndUpdate(
        id, 
        { 
          isTemplate: false,
          $unset: { templateId: 1 }
        }, 
        { new: true }
      )
      .exec();
    
    if (!updatedPlan) {
      throw new NotFoundException(`Training plan with ID ${id} not found`);
    }
    
    return updatedPlan;
  }
}

// Utilidades
function rand(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Prototipo de método en instancia; usamos función dentro de la clase
// Generador simple con prefijo para ids lógicos
// Nota: no es un ObjectId; sirve para identificar de forma estable sesiones/ejercicios/sets
// cuando el frontend aún no los tiene persistidos.
// Prefijos sugeridos: 'S' (session), 'E' (exercise), 'PS' (performedSet)
// Ejemplo: S-AB12CD
// Implementado como método de instancia para usar this.generateId en el servicio
declare module './training-plans.service' {
  interface TrainingPlansService {
    generateId(prefix: string): string;
  }
}

// Añadimos el método a la clase prototype en tiempo de ejecución
(TrainingPlansService as any).prototype.generateId = function(prefix: string): string {
  return `${prefix}-${rand()}`;
};
