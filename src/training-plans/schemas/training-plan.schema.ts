import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';


// Subesquema para performedSets
@Schema()
export class PerformedSetSchema {
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
  @Prop({ required: true })
  performedSets: [PerformedSetSchema];
}

// Subesquema para sessions
@Schema()
export class SessionSchema {
  @Prop({ required: true })
  sessionName: string;
  @Prop({ required: true })
  date: string;
  @Prop({ required: true })
  exercises: [ExerciseSchema];
}

@Schema({ timestamps: true })
export class TrainingPlan {
  @Prop({ required: true })
  athleteId: string;

  @Prop({ required: true, unique: true })
  coachId: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  startDate: Date;

  @Prop({ required: true })
  endDate: Date;

  @Prop({ required: true })
  sessions: SessionSchema[];
}

export type TrainingPlanDocument = TrainingPlan & Document;
export const TrainingPlanSchema = SchemaFactory.createForClass(TrainingPlan);


