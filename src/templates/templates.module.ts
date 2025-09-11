import { Module, OnModuleInit } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TemplatesService } from './templates.service';
import { TemplatesController } from './templates.controller';
import { Template, TemplateSchema } from './schemas/template.schema';
import { TrainingPlan, TrainingPlanSchema } from '../training-plans/schemas/training-plan.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Template.name, schema: TemplateSchema },
      { name: TrainingPlan.name, schema: TrainingPlanSchema },
    ]),
  ],
  controllers: [TemplatesController],
  providers: [TemplatesService],
  exports: [TemplatesService],
})
export class TemplatesModule implements OnModuleInit {
  constructor(private readonly templatesService: TemplatesService) {}

  async onModuleInit() {
    // Crear plantillas predefinidas al inicializar el módulo
    await this.templatesService.createPredefinedTemplates();
  }
}
