import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, UploadedFile, UseInterceptors, Req, UnauthorizedException } from '@nestjs/common';
import { TrainingPlansService } from './training-plans.service';
import { CreateTrainingPlanDto } from './dto/create-training-plan.dto';
import { UpdateTrainingPlanDto } from './dto/update-training-plan.dto';
import { CreateTemplateFromPlanDto } from '../templates/dto/create-template-from-plan.dto';
import { SubmitExerciseFeedbackDto } from './dto/submit-exercise-feedback.dto';
import { UpdateSessionNotesDto } from './dto/update-session-notes.dto';
import { SubmitPerformedSetsDto } from './dto/submit-performed-sets.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { join } from 'path';

@Controller('training-plans')
export class TrainingPlansController {
  constructor(private readonly trainingPlansService: TrainingPlansService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() createTrainingPlanDto: CreateTrainingPlanDto) {
    return this.trainingPlansService.create(createTrainingPlanDto);
  }

  @UseGuards(JwtAuthGuard)
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

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.trainingPlansService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTrainingPlanDto: UpdateTrainingPlanDto) {
    return this.trainingPlansService.update(id, updateTrainingPlanDto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.trainingPlansService.remove(id);
  }

  // Convertir un plan de entrenamiento en plantilla
  @UseGuards(JwtAuthGuard)
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
  @UseGuards(JwtAuthGuard)
  @Patch(':id/remove-template-status')
  removeTemplateStatus(@Param('id') id: string) {
    return this.trainingPlansService.removeTemplateStatus(id);
  }

  // Registrar feedback de un ejercicio (con media opcional)
  @UseGuards(JwtAuthGuard)
  @Post('feedback/exercise')
  @UseInterceptors(FileInterceptor('media', {
    storage: diskStorage({
      destination: join(process.cwd(), 'uploads'),
      filename: (_req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = file.originalname.split('.').pop();
        cb(null, `${uniqueSuffix}.${ext}`);
      },
    }),
    limits: {
      fileSize: 90 * 1024 * 1024, // 90MB por si suben video 1:30 min
    },
  }))

  @UseGuards(JwtAuthGuard)
  async submitExerciseFeedback(
    @Body() body: SubmitExerciseFeedbackDto,
    @UploadedFile() file: any,
    @Req() req,
  ) {
    const mediaUrl = file ? `uploads/${file.filename}` : undefined;
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

  // Actualizar performed sets de un ejercicio
  @UseGuards(JwtAuthGuard)
  @Patch('feedback/exercise-sets')
  async submitPerformedSets(
    @Body() body: SubmitPerformedSetsDto,
    @Req() req,
  ) {
    return this.trainingPlansService.submitPerformedSets({
      ...body,
      athleteId: req.user.userId,
    });
  }

  // Dashboard de métricas de entrenamiento para coaches
  @UseGuards(JwtAuthGuard)
  @Get('dashboard/:coachId')
  async getDashboardStats(@Param('coachId') coachId: string, @Req() req) {
    // Verificar que el usuario sea un coach y que esté accediendo a su propio dashboard
    if (req.user.role !== 'coach') {
      throw new UnauthorizedException('Solo los coaches pueden acceder al dashboard');
    }
    
    // Validar que el coach esté accediendo a su propio dashboard
    if (req.user.coachId !== coachId) {
      throw new UnauthorizedException('No autorizado para acceder a este dashboard');
    }

    const plans = await this.trainingPlansService.findByCoachId(coachId);

    const activePlans = plans.filter((plan: any) =>
      Array.isArray(plan.sessions) && plan.sessions.some((s: any) => !s.completed)
    ).length;

    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    let completedSessionsThisWeek = 0;
    let totalSessions = 0;
    let completedSessions = 0;
    let pendingSessions = 0;
    let upcomingSessionsCount = 0;

    plans.forEach((plan: any) => {
      (plan.sessions || []).forEach((session: any) => {
        totalSessions++;
        const sessionDate = new Date(session.date);
        
        if (session.completed) {
          completedSessions++;
          if (sessionDate >= weekAgo) {
            completedSessionsThisWeek++;
          }
        } else {
          // Sesión no completada
          if (sessionDate >= now && sessionDate <= new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)) {
            // Próximos 7 días
            upcomingSessionsCount++;
          } else {
            // Pendientes (pasadas o futuras más allá de 7 días)
            pendingSessions++;
          }
        }
      });
    });

    const completionRate = totalSessions > 0
      ? Math.round((completedSessionsThisWeek / totalSessions) * 100)
      : 0;

    const weeklyProgress: Array<{ day: string; completed: number; scheduled: number }> = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dayName = date.toLocaleDateString('es-ES', { weekday: 'short' });

      let completed = 0;
      let scheduled = 0;

      plans.forEach((plan: any) => {
        (plan.sessions || []).forEach((session: any) => {
          const sessionDate = new Date(session.date);
          if (sessionDate.toDateString() === date.toDateString()) {
            scheduled++;
            if (session.completed) completed++;
          }
        });
      });

      weeklyProgress.push({
        day: dayName.charAt(0).toUpperCase() + dayName.slice(1),
        completed,
        scheduled,
      });
    }

    const upcomingSessions: Array<{
      id: string;
      athleteName: string;
      sessionName: string;
      date: string;
      time: string;
      status: string;
    }> = [];

    const futureDate = new Date(now);
    futureDate.setDate(futureDate.getDate() + 7);

    plans.forEach((plan: any) => {
      (plan.sessions || [])
        .filter((session: any) => {
          const d = new Date(session.date);
          return d >= now && d <= futureDate && !session.completed;
        })
        .forEach((session: any) => {
          upcomingSessions.push({
            id: `${String(plan._id)}-${session.sessionId || ''}`,
            athleteName: plan.athleteId?.fullName || 'Atleta',
            sessionName: session.sessionName || 'Sesión de Entrenamiento',
            date: session.date,
            time: '09:00',
            status: 'scheduled',
          });
        });
    });

    upcomingSessions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const recentSessions = upcomingSessions.slice(0, 5);

    // Distribución de sesiones
    const sessionDistribution = [
      {
        name: 'Completadas',
        value: completedSessions,
        color: '#D72638',
      },
      {
        name: 'Próximas (7 días)',
        value: upcomingSessionsCount,
        color: '#F5B700',
      },
      {
        name: 'Pendientes',
        value: pendingSessions,
        color: '#5A5A5A',
      },
    ];

    return {
      stats: {
        activePlans,
        completedSessionsThisWeek,
        completionRate,
        totalSessions,
      },
      weeklyProgress,
      upcomingSessions: recentSessions,
      sessionDistribution,
    };
  }
}
