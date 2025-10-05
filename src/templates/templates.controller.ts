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
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('templates')
export class TemplatesController {
  constructor(private readonly templatesService: TemplatesService) {}

  // Crear una nueva plantilla
  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() createTemplateDto: CreateTemplateDto) {
    return this.templatesService.create(createTemplateDto);
  }

  // Crear plantilla desde un plan de entrenamiento
  @Post('from-plan')
  @UseGuards(JwtAuthGuard)
  createFromPlan(@Body() createTemplateFromPlanDto: CreateTemplateFromPlanDto) {
    return this.templatesService.createFromTrainingPlan(createTemplateFromPlanDto);
  }

  // Obtener todas las plantillas con filtros opcionales
  @Get()
  @UseGuards(JwtAuthGuard)
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
  @UseGuards(JwtAuthGuard)
  getMostUsed(@Query('limit') limit?: string) {
    const limitNumber = limit ? parseInt(limit, 10) : 10;
    return this.templatesService.getMostUsed(limitNumber);
  }

  // Obtener plantillas predefinidas
  @Get('predefined')
  @UseGuards(JwtAuthGuard)
  findPredefined() {
    return this.templatesService.findPredefined();
  }

  // Obtener plantillas por tipo
  @Get('by-type/:type')
  @UseGuards(JwtAuthGuard)
  findByType(@Param('type') type: TemplateType) {
    return this.templatesService.findByType(type);
  }

  // Obtener plantillas creadas por un usuario
  @Get('by-creator/:createdBy')
  @UseGuards(JwtAuthGuard)
  findByCreator(@Param('createdBy') createdBy: string) {
    return this.templatesService.findByCreator(createdBy);
  }

  // Obtener una plantilla específica
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: string) {
    return this.templatesService.findOne(id);
  }

  // Actualizar una plantilla
  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id') id: string, @Body() updateTemplateDto: UpdateTemplateDto) {
    return this.templatesService.update(id, updateTemplateDto);
  }

  // Incrementar contador de uso de una plantilla
  @Patch(':id/increment-usage')
  @UseGuards(JwtAuthGuard)
  incrementUsage(@Param('id') id: string) {
    return this.templatesService.incrementUsage(id);
  }

  // Eliminar una plantilla (soft delete)
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string) {
    return this.templatesService.remove(id);
  }
}
