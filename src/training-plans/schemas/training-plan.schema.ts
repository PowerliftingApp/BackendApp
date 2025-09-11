import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';


// Subesquema para performedSets
@Schema()
export class PerformedSetSchema {
  @Prop({ required: true })
  setId: string;
  @Prop({ required: true })
  setNumber: number;
  @Prop({ default: null })
  repsPerformed: number;
  @Prop({ default: null })
  loadUsed: number;
  @Prop({ default: null })
  measureAchieved: number;
}
@Schema()
export class ExerciseSchema {
  @Prop({ required: true })
  exerciseId: string;
  @Prop({ required: true })
  name: string; 
  @Prop({ required: true })
  sets: number;
  @Prop({ required: true })
  reps: number;
  @Prop({ default: null })
  rpe: number;
  @Prop({ default: null })
  rir: number;
  @Prop({ default: null })
  rm: number;
  @Prop({ default: null })
  notes: string;
  @Prop({ default: null })
  weight: number;
  // Feedback del atleta
  @Prop({ default: false })
  completed?: boolean;
  @Prop({ default: null })
  performanceComment?: string; // comentarios sobre superar/no alcanzar RPE/RIR/RM
  @Prop({ default: null })
  mediaUrl?: string; // imagen o video (servido estático)
  @Prop({ default: null })
  athleteNotes?: string; // notas adicionales
  @Prop({ required: true })
  performedSets: [PerformedSetSchema];
}

// Subesquema para sessions
@Schema()
export class SessionSchema {
  @Prop({ required: true })
  sessionId: string;
  @Prop({ required: true })
  sessionName: string;
  @Prop({ required: true })
  date: string;
  // Notas generales de la sesión
  @Prop({ default: null })
  sessionNotes?: string;
  @Prop({ required: true })
  exercises: [ExerciseSchema];
}

@Schema({ timestamps: true })
export class TrainingPlan {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  athleteId: string;

  @Prop({ required: true, index: true })
  coachId: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  startDate: Date;

  @Prop({ required: true })
  endDate: Date;

  @Prop({ required: true })
  sessions: SessionSchema[];

  @Prop({ default: false })
  isTemplate: boolean;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Template' })
  templateId?: string;
}

export type TrainingPlanDocument = TrainingPlan & Document;
export const TrainingPlanSchema = SchemaFactory.createForClass(TrainingPlan);

// Eliminar el índice único existente
TrainingPlanSchema.index({ coachId: 1 }, { unique: false });


