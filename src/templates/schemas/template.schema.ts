import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { SessionSchema } from '../../training-plans/schemas/training-plan.schema';

export enum TemplateType {
  PREDEFINED = 'predefined',    // Plantillas predefinidas del sistema
  USER_CREATED = 'user_created' // Plantillas creadas por usuarios
}

export enum TemplatePredefinedCategory {
  FUERZA_BASICO = 'fuerza_basico',
  HIPERTROFIA = 'hipertrofia',
  RESISTENCIA = 'resistencia'
}

@Schema({ timestamps: true })
export class Template {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  description: string;

  @Prop({ 
    type: String, 
    enum: TemplateType, 
    required: true 
  })
  type: TemplateType;

  @Prop({ 
    type: String, 
    enum: TemplatePredefinedCategory,
    required: function() { return this.type === TemplateType.PREDEFINED; }
  })
  predefinedCategory?: TemplatePredefinedCategory;

  // Solo requerido si es una plantilla creada por usuario
  @Prop({ 
    type: String,
    required: function() { return this.type === TemplateType.USER_CREATED; }
  })
  createdBy?: string;

  // ID del plan de entrenamiento original (si se creó desde un plan)
  @Prop({ 
    type: MongooseSchema.Types.ObjectId, 
    ref: 'TrainingPlan'
  })
  originalPlanId?: string;

  @Prop({ required: true })
  sessions: SessionSchema[];

  // Metadatos adicionales
  @Prop({ default: 0 })
  usageCount: number; // Cuántas veces se ha usado esta plantilla

  @Prop({ default: true })
  isActive: boolean; // Para poder desactivar plantillas sin eliminarlas
}

export type TemplateDocument = Template & Document;
export const TemplateSchema = SchemaFactory.createForClass(Template);

// Índices para optimizar búsquedas
TemplateSchema.index({ type: 1 });
TemplateSchema.index({ createdBy: 1 });
TemplateSchema.index({ predefinedCategory: 1 });
TemplateSchema.index({ isActive: 1 });
