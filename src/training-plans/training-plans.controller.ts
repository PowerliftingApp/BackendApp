import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, UploadedFile, UseInterceptors, Req } from '@nestjs/common';
import { TrainingPlansService } from './training-plans.service';
import { CreateTrainingPlanDto } from './dto/create-training-plan.dto';
import { UpdateTrainingPlanDto } from './dto/update-training-plan.dto';
import { CreateTemplateFromPlanDto } from '../templates/dto/create-template-from-plan.dto';
import { SubmitExerciseFeedbackDto } from './dto/submit-exercise-feedback.dto';
import { UpdateSessionNotesDto } from './dto/update-session-notes.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('training-plans')
export class TrainingPlansController {
  constructor(private readonly trainingPlansService: TrainingPlansService) {}

  @Post()
  create(@Body() createTrainingPlanDto: CreateTrainingPlanDto) {
    return this.trainingPlansService.create(createTrainingPlanDto);
  }

  @Get()
  findAll(@Query('athleteId') athleteId?: string, @Query('coachId') coachId?: string) {
    if (athleteId && coachId) {
      return this.trainingPlansService.findByCoachAndAthlete(coachId, athleteId);
    }
    if (athleteId) {
      return this.trainingPlansService.findByAthleteId(athleteId);
    }
    if (coachId) {
      return this.trainingPlansService.findByCoachId(coachId);
    }
    return this.trainingPlansService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.trainingPlansService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTrainingPlanDto: UpdateTrainingPlanDto) {
    return this.trainingPlansService.update(id, updateTrainingPlanDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.trainingPlansService.remove(id);
  }

  // Convertir un plan de entrenamiento en plantilla
  @Post(':id/convert-to-template')
  convertToTemplate(
    @Param('id') planId: string,
    @Body() templateData: Omit<CreateTemplateFromPlanDto, 'planId'>
  ) {
    const createTemplateFromPlanDto: CreateTemplateFromPlanDto = {
      ...templateData,
      planId
    };
    return this.trainingPlansService.convertToTemplate(createTemplateFromPlanDto);
  }

  // Desmarcar plan como plantilla
  @Patch(':id/remove-template-status')
  removeTemplateStatus(@Param('id') id: string) {
    return this.trainingPlansService.removeTemplateStatus(id);
  }

  // Registrar feedback de un ejercicio (con media opcional)
  @UseGuards(JwtAuthGuard)
  @Post('feedback/exercise')
  @UseInterceptors(FileInterceptor('media'))
  async submitExerciseFeedback(
    @Body() body: SubmitExerciseFeedbackDto,
    @UploadedFile() file: any,
    @Req() req,
  ) {
    const mediaUrl = file ? `/uploads/${file.filename}` : undefined;
    return this.trainingPlansService.submitExerciseFeedback({
      ...body,
      athleteId: req.user.userId,
      mediaUrl,
    });
  }

  // Actualizar notas generales de una sesión
  @UseGuards(JwtAuthGuard)
  @Patch('feedback/session-notes')
  async updateSessionNotes(
    @Body() body: UpdateSessionNotesDto,
    @Req() req,
  ) {
    return this.trainingPlansService.updateSessionNotes({
      ...body,
      athleteId: req.user.userId,
    });
  }
}
