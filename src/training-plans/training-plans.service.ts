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
import { SubmitPerformedSetsDto } from './dto/submit-performed-sets.dto';

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
        exercises: (s.exercises || []).map((e: any) => {
          const normalizedPerformedSets = buildPerformedSetsFromExercise(e, (p: string) => this.generateId(p));
          return {
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
            performedSets: normalizedPerformedSets,
          };
        }),
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
    if (!plan) throw new NotFoundException(`Training plan con ID ${planId} no encontrado`);

    if (String(plan.athleteId) !== String(athleteId)) {
      throw new NotFoundException('No autorizado para actualizar este plan');
    }

    // Buscar sesión y ejercicio por índices o ids lógicos
    const sessionIndex = plan.sessions.findIndex((s: any) => String((s as any)._id ?? s.sessionId ?? '') === String(sessionId));
    if (sessionIndex === -1) throw new NotFoundException('Sesión no encontrada');

    const exerciseIndex = (plan.sessions[sessionIndex].exercises as any[]).findIndex((e: any) => String((e as any)._id ?? e.exerciseId ?? '') === String(exerciseId));
    if (exerciseIndex === -1) throw new NotFoundException('Ejercicio no encontrado');

    const exercise: any = plan.sessions[sessionIndex].exercises[exerciseIndex];

    console.log('completed', completed);
    
    if (typeof completed === 'boolean') {
      exercise.completed = completed;
    } else if (typeof completed === 'string') {
      if (completed === 'true') exercise.completed = true;
      else if (completed === 'false') exercise.completed = false;
    }
    if (typeof performanceComment === 'string') exercise.performanceComment = performanceComment;
    if (typeof athleteNotes === 'string') exercise.athleteNotes = athleteNotes;
    if (mediaUrl) exercise.mediaUrl = mediaUrl;

    plan.markModified('sessions');
    await plan.save();
    // Recalcular estado de sesión
    this.recalculateCompletion(plan, sessionIndex);
    return plan;
  }

  async updateSessionNotes(params: UpdateSessionNotesDto & { athleteId: string }): Promise<TrainingPlan> {
    const { planId, sessionId, sessionNotes, athleteId } = params;
    const plan = await this.trainingPlanModel.findById(planId).exec();
    if (!plan) throw new NotFoundException(`Training plan con ID ${planId} no encontrado`);

    if (String(plan.athleteId) !== String(athleteId)) {
      throw new NotFoundException('No autorizado para actualizar este plan');
    }

    const sessionIndex = plan.sessions.findIndex((s: any) => String((s as any)._id ?? s.sessionId ?? '') === String(sessionId));
    if (sessionIndex === -1) throw new NotFoundException('Sesión no encontrada');

    (plan.sessions[sessionIndex] as any).sessionNotes = sessionNotes ?? null;
    plan.markModified('sessions');
    await plan.save();
    return plan;
  }

  async submitPerformedSets(params: SubmitPerformedSetsDto & { athleteId: string }): Promise<TrainingPlan> {
    const { planId, sessionId, exerciseId, sets, athleteId } = params;
    const plan = await this.trainingPlanModel.findById(planId).exec();
    if (!plan) throw new NotFoundException(`Training plan con ID ${planId} no encontrado`);
    if (String(plan.athleteId) !== String(athleteId)) {
      throw new NotFoundException('No autorizado para actualizar este plan');
    }

    const sIdx = plan.sessions.findIndex((s: any) => String((s as any)._id ?? s.sessionId ?? '') === String(sessionId));
    if (sIdx === -1) throw new NotFoundException('Sesión no encontrada');
    const eIdx = (plan.sessions[sIdx].exercises as any[]).findIndex((e: any) => String((e as any)._id ?? e.exerciseId ?? '') === String(exerciseId));
    if (eIdx === -1) throw new NotFoundException('Ejercicio no encontrado');

    const exercise: any = plan.sessions[sIdx].exercises[eIdx];
    // Actualizar sets por setId
    for (const input of sets) {
      const idx = (exercise.performedSets as any[]).findIndex((ps: any) => String(ps.setId) === String(input.setId));
      if (idx !== -1) {
        const target = exercise.performedSets[idx] as any;
        if (typeof input.completed === 'boolean') target.completed = input.completed;
        if (typeof input.repsPerformed !== 'undefined') target.repsPerformed = input.repsPerformed;
        if (typeof input.loadUsed !== 'undefined') target.loadUsed = input.loadUsed;
        if (typeof input.measureAchieved !== 'undefined') target.measureAchieved = input.measureAchieved;
      }
    }

    // Recalcular completado del ejercicio: todos los sets completados
    const setsArr = (exercise.performedSets as any[]);
    exercise.completed = setsArr.length > 0 && setsArr.every((ps: any) => !!ps.completed);

    plan.markModified('sessions');
    await plan.save();
    this.recalculateCompletion(plan, sIdx);
    return plan;
  }

  private recalculateCompletion(plan: any, sessionIndex: number) {
    const session = plan.sessions[sessionIndex];
    // Sesión completada si todos los ejercicios completed === true y hay al menos uno
    const exercises = (session.exercises as any[]);
    session.completed = exercises.length > 0 && exercises.every((e: any) => !!e.completed);
  }

  async findOne(id: string): Promise<TrainingPlan> {
    const plan = await this.trainingPlanModel
      .findById(id)
      .populate('athleteId', 'fullName email')
      .exec();
    if (!plan) {
      throw new NotFoundException(`Training plan con ID ${id} no encontrado`);
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
    // En updates, completar ids faltantes y ajustar performedSets al número de sets
    const existingPlan = await this.trainingPlanModel.findById(id).exec();
    if (!existingPlan) {
      throw new NotFoundException(`Training plan con ID ${id} no encontrado`);
    }

    const merged = {
      sessions: (updateTrainingPlanDto.sessions || []).map((s: any) => {
        const existingSession: any = (existingPlan.sessions as any[]).find((xs: any) => String((xs as any)._id ?? xs.sessionId ?? '') === String(s.sessionId)) || {};
        return {
          sessionId: s.sessionId || existingSession.sessionId || this.generateId('S'),
          sessionName: s.sessionName,
          date: s.date,
          sessionNotes: s.sessionNotes ?? (existingSession.sessionNotes ?? null),
          exercises: (s.exercises || []).map((e: any) => {
            const existingExercise: any = (existingSession.exercises || []).find((xe: any) => String((xe as any)._id ?? xe.exerciseId ?? '') === String(e.exerciseId)) || {};
            // Construir performedSets preservando por setId si existen, y generando faltantes
            const normalized = buildPerformedSetsFromExercise({
              ...e,
              performedSets: (e.performedSets && e.performedSets.length ? e.performedSets : existingExercise.performedSets) || [],
            }, (p: string) => this.generateId(p));
            return {
              exerciseId: e.exerciseId || existingExercise.exerciseId || this.generateId('E'),
              name: e.name,
              sets: e.sets,
              reps: e.reps,
              rpe: e.rpe ?? (existingExercise.rpe ?? null),
              rir: e.rir ?? (existingExercise.rir ?? null),
              rm: e.rm ?? (existingExercise.rm ?? null),
              notes: e.notes ?? (existingExercise.notes ?? null),
              weight: e.weight ?? (existingExercise.weight ?? null),
              completed: typeof e.completed === 'boolean' ? e.completed : (existingExercise.completed ?? false),
              performanceComment: e.performanceComment ?? (existingExercise.performanceComment ?? null),
              mediaUrl: e.mediaUrl ?? (existingExercise.mediaUrl ?? null),
              athleteNotes: e.athleteNotes ?? (existingExercise.athleteNotes ?? null),
              performedSets: normalized,
            };
          })
        };
      })
    } as any;

    const updatedPlan = await this.trainingPlanModel
      .findByIdAndUpdate(id, merged, { new: true })
      .exec();
    if (!updatedPlan) {
      throw new NotFoundException(`Training plan con ID ${id} no encontrado`);
    }
    return updatedPlan;
  }

  async remove(id: string): Promise<void> {
    const result = await this.trainingPlanModel.deleteOne({ _id: id }).exec();
    if (result.deletedCount === 0) {
      throw new NotFoundException(`Training plan con ID ${id} no encontrado`);
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
      throw new NotFoundException(`Training plan con ID ${id} no encontrado`);
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

// Helper: asegura que existan 'sets' performed vacíos acorde a e.sets.
// - Si el DTO trae algunos performedSets, se respetan y se completan hasta 'sets'.
// - Si no trae ninguno, se generan todos vacíos.
function buildPerformedSetsFromExercise(exercise: any, genId: (prefix: string) => string) {
  const totalSets = Number(exercise?.sets) || 0;
  const existing = Array.isArray(exercise?.performedSets) ? exercise.performedSets : [];

  const normalized: any[] = [];
  for (let i = 0; i < totalSets; i++) {
    const src = existing[i] || {};
    normalized.push({
      setId: src.setId || genId('PS'),
      setNumber: src.setNumber ?? i + 1,
      repsPerformed: typeof src.repsPerformed === 'number' ? src.repsPerformed : null,
      loadUsed: typeof src.loadUsed === 'number' ? src.loadUsed : null,
      measureAchieved: typeof src.measureAchieved === 'number' ? src.measureAchieved : null,
      completed: typeof src.completed === 'boolean' ? src.completed : false,
    });
  }
  return normalized;
}
