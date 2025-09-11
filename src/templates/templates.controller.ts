import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete, 
  Query,
  UseGuards
} from '@nestjs/common';
import { TemplatesService } from './templates.service';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';
import { CreateTemplateFromPlanDto } from './dto/create-template-from-plan.dto';
import { TemplateType } from './schemas/template.schema';

@Controller('templates')
export class TemplatesController {
  constructor(private readonly templatesService: TemplatesService) {}

  // Crear una nueva plantilla
  @Post()
  create(@Body() createTemplateDto: CreateTemplateDto) {
    return this.templatesService.create(createTemplateDto);
  }

  // Crear plantilla desde un plan de entrenamiento
  @Post('from-plan')
  createFromPlan(@Body() createTemplateFromPlanDto: CreateTemplateFromPlanDto) {
    return this.templatesService.createFromTrainingPlan(createTemplateFromPlanDto);
  }

  // Obtener todas las plantillas con filtros opcionales
  @Get()
  findAll(
    @Query('type') type?: TemplateType,
    @Query('createdBy') createdBy?: string,
    @Query('predefined') predefined?: string
  ) {
    if (predefined === 'true') {
      return this.templatesService.findPredefined();
    }
    if (type) {
      return this.templatesService.findByType(type);
    }
    if (createdBy) {
      return this.templatesService.findByCreator(createdBy);
    }
    return this.templatesService.findAll();
  }

  // Obtener plantillas más utilizadas
  @Get('most-used')
  getMostUsed(@Query('limit') limit?: string) {
    const limitNumber = limit ? parseInt(limit, 10) : 10;
    return this.templatesService.getMostUsed(limitNumber);
  }

  // Obtener plantillas predefinidas
  @Get('predefined')
  findPredefined() {
    return this.templatesService.findPredefined();
  }

  // Obtener plantillas por tipo
  @Get('by-type/:type')
  findByType(@Param('type') type: TemplateType) {
    return this.templatesService.findByType(type);
  }

  // Obtener plantillas creadas por un usuario
  @Get('by-creator/:createdBy')
  findByCreator(@Param('createdBy') createdBy: string) {
    return this.templatesService.findByCreator(createdBy);
  }

  // Obtener una plantilla específica
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.templatesService.findOne(id);
  }

  // Actualizar una plantilla
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTemplateDto: UpdateTemplateDto) {
    return this.templatesService.update(id, updateTemplateDto);
  }

  // Incrementar contador de uso de una plantilla
  @Patch(':id/increment-usage')
  incrementUsage(@Param('id') id: string) {
    return this.templatesService.incrementUsage(id);
  }

  // Eliminar una plantilla (soft delete)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.templatesService.remove(id);
  }
}
