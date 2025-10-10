# Pruebas Unitarias - Módulo de Training Plans (Planes de Entrenamiento)

Este documento contiene la documentación de todas las pruebas unitarias implementadas para el módulo de planes de entrenamiento del sistema Powerlift. Este es el módulo más complejo y crítico de la aplicación.

## Índice
- [TrainingPlansService](#trainingplansservice)
- [TrainingPlansController](#trainingplanscontroller)
- [Ejecutar las pruebas](#ejecutar-las-pruebas)

---

## TrainingPlansService

El `TrainingPlansService` es el servicio más complejo de la aplicación, responsable de gestionar planes de entrenamiento, feedback de atletas, seguimiento de sesiones y ejercicios, y conversión a plantillas.

### Archivo de pruebas
`training-plans.service.spec.ts`

### Casos de Prueba

#### Validación del Servicio

| # | Nombre de la Prueba | Descripción | Resultado Esperado |
|---|---------------------|-------------|-------------------|
| 1 | `debe estar definido el servicio` | Verifica que el servicio TrainingPlansService se instancia correctamente | El servicio debe estar definido y no ser null |

#### Método `create(createTrainingPlanDto)`

| # | Nombre de la Prueba | Descripción | Resultado Esperado | Código de Prueba |
|---|---------------------|-------------|--------------------|------------------|
| 2 | `debe crear un plan de entrenamiento con IDs generados automáticamente` | Crea un plan completo con generación automática de IDs para sesiones, ejercicios y sets | Plan creado con todos los IDs asignados | ```typescript<br>const createDto = { athleteId, coachId, name, startDate, endDate, sessions };<br>const result = await service.create(createDto);<br>expect(result).toBeDefined();<br>expect(mockTrainingPlanModel).toHaveBeenCalled();<br>``` |
| 3 | `debe generar IDs únicos para sesiones, ejercicios y sets` | Verifica que los IDs generados tengan el formato correcto con prefijos | IDs con formato: S-XXXXXX, E-XXXXXX, PS-XXXXXX | ```typescript<br>await service.create(createDto);<br>const callArg = mockTrainingPlanModel.mock.calls[0][0];<br>expect(callArg.sessions[0].sessionId).toMatch(/^S-/);<br>expect(callArg.sessions[0].exercises[0].exerciseId).toMatch(/^E-/);<br>``` |
| 4 | `debe crear performedSets vacíos según el número de sets` | Inicializa arrays de performedSets con la cantidad correcta según sets del ejercicio | Array con longitud igual al número de sets | ```typescript<br>const createDto = { sessions: [{ exercises: [{ sets: 5, reps: 5 }] }] };<br>await service.create(createDto);<br>const callArg = mockTrainingPlanModel.mock.calls[0][0];<br>expect(callArg.sessions[0].exercises[0].performedSets).toHaveLength(5);<br>``` |
| 5 | `debe establecer valores por defecto para campos opcionales` | Campos opcionales se inicializan con valores por defecto (null o false) | Valores por defecto: rpe: null, rir: null, completed: false | ```typescript<br>await service.create(createDto);<br>const exercise = callArg.sessions[0].exercises[0];<br>expect(exercise.rpe).toBeNull();<br>expect(exercise.completed).toBe(false);<br>``` |

#### Método `findAll()`

| # | Nombre de la Prueba | Descripción | Resultado Esperado | Código de Prueba |
|---|---------------------|-------------|--------------------|------------------|
| 6 | `debe retornar todos los planes de entrenamiento` | Obtiene todos los planes sin filtros | Array con todos los planes | ```typescript<br>mockTrainingPlanModel.find.mockReturnValue({<br>  populate: jest.fn().mockReturnValue({<br>    exec: jest.fn().mockResolvedValue(mockPlans)<br>  })<br>});<br>const result = await service.findAll();<br>expect(result).toEqual(mockPlans);<br>``` |
| 7 | `debe popular el campo athleteId con fullName y email` | Verifica que se incluyen datos del atleta | Populate con 'fullName email' | ```typescript<br>await service.findAll();<br>expect(populateMock).toHaveBeenCalledWith('athleteId', 'fullName email');<br>``` |

#### Método `findOne(id)`

| # | Nombre de la Prueba | Descripción | Resultado Esperado | Código de Prueba |
|---|---------------------|-------------|--------------------|------------------|
| 8 | `debe retornar un plan de entrenamiento por ID` | Busca y retorna un plan específico con datos del atleta | Objeto del plan con athleteId populado | ```typescript<br>const result = await service.findOne(mockPlanId);<br>expect(result).toEqual(mockTrainingPlan);<br>expect(mockTrainingPlanModel.findById).toHaveBeenCalledWith(mockPlanId);<br>``` |
| 9 | `debe lanzar NotFoundException si el plan no existe` | Maneja planes no encontrados | Lanza `NotFoundException` con mensaje descriptivo | ```typescript<br>await expect(service.findOne('id_inexistente')).rejects.toThrow(<br>  new NotFoundException('Training plan con ID id_inexistente no encontrado')<br>);<br>``` |

#### Método `findByAthleteId(athleteId)`

| # | Nombre de la Prueba | Descripción | Resultado Esperado | Código de Prueba |
|---|---------------------|-------------|--------------------|------------------|
| 10 | `debe retornar planes filtrados por ID de atleta` | Filtra planes de un atleta específico | Array de planes del atleta | ```typescript<br>const result = await service.findByAthleteId(mockAthleteId);<br>expect(result).toEqual(athletePlans);<br>expect(mockTrainingPlanModel.find).toHaveBeenCalledWith({ athleteId: mockAthleteId });<br>``` |

#### Método `findByCoachId(coachId)`

| # | Nombre de la Prueba | Descripción | Resultado Esperado | Código de Prueba |
|---|---------------------|-------------|--------------------|------------------|
| 11 | `debe retornar planes filtrados por ID de coach` | Filtra todos los planes de un coach | Array de planes del coach | ```typescript<br>const result = await service.findByCoachId(mockCoachId);<br>expect(mockTrainingPlanModel.find).toHaveBeenCalledWith({ coachId: mockCoachId });<br>``` |

#### Método `findByCoachAndAthlete(coachId, athleteId)`

| # | Nombre de la Prueba | Descripción | Resultado Esperado | Código de Prueba |
|---|---------------------|-------------|--------------------|------------------|
| 12 | `debe retornar planes filtrados por coach y atleta` | Filtra planes de una relación específica coach-atleta | Array de planes de la relación | ```typescript<br>const result = await service.findByCoachAndAthlete(mockCoachId, mockAthleteId);<br>expect(mockTrainingPlanModel.find).toHaveBeenCalledWith({<br>  coachId: mockCoachId, athleteId: mockAthleteId<br>});<br>``` |

#### Método `update(id, updateTrainingPlanDto)`

| # | Nombre de la Prueba | Descripción | Resultado Esperado | Código de Prueba |
|---|---------------------|-------------|--------------------|------------------|
| 13 | `debe actualizar un plan de entrenamiento correctamente` | Actualiza campos del plan | Plan actualizado con nuevos valores | ```typescript<br>const updateDto = { name: 'Plan Actualizado' };<br>const result = await service.update(mockPlanId, updateDto);<br>expect(result.name).toBe('Plan Actualizado');<br>``` |
| 14 | `debe lanzar NotFoundException si el plan no existe` | Maneja actualizaciones de planes inexistentes | Lanza `NotFoundException` | ```typescript<br>await expect(service.update('id_inexistente', { name: 'Nuevo' }))<br>  .rejects.toThrow(NotFoundException);<br>``` |
| 15 | `debe actualizar fechas correctamente` | Convierte strings de fecha a objetos Date | startDate y endDate son instancias de Date | ```typescript<br>const updateDto = { startDate: '2025-02-01', endDate: '2025-04-01' };<br>await service.update(mockPlanId, updateDto);<br>expect(callArg.startDate).toBeInstanceOf(Date);<br>``` |
| 16 | `debe preservar IDs existentes al actualizar sesiones` | Mantiene IDs de sesiones y ejercicios al actualizar | IDs originales se preservan | ```typescript<br>await service.update(mockPlanId, updateDto);<br>expect(callArg.sessions[0].sessionId).toBe('S-123456');<br>expect(callArg.sessions[0].exercises[0].exerciseId).toBe('E-123456');<br>``` |

#### Método `remove(id)`

| # | Nombre de la Prueba | Descripción | Resultado Esperado | Código de Prueba |
|---|---------------------|-------------|--------------------|------------------|
| 17 | `debe eliminar un plan de entrenamiento` | Elimina permanentemente un plan | Plan eliminado de la base de datos | ```typescript<br>await service.remove(mockPlanId);<br>expect(mockTrainingPlanModel.deleteOne).toHaveBeenCalledWith({ _id: mockPlanId });<br>``` |
| 18 | `debe lanzar NotFoundException si el plan no existe` | Maneja eliminación de planes inexistentes | Lanza `NotFoundException` | ```typescript<br>await expect(service.remove('id_inexistente')).rejects.toThrow(<br>  NotFoundException<br>);<br>``` |

#### Método `submitExerciseFeedback(params)`

| # | Nombre de la Prueba | Descripción | Resultado Esperado | Código de Prueba |
|---|---------------------|-------------|--------------------|------------------|
| 19 | `debe actualizar el feedback de un ejercicio` | Actualiza completed, performanceComment y athleteNotes | Ejercicio actualizado con feedback | ```typescript<br>const feedbackDto = {<br>  planId, sessionId, exerciseId, completed: true,<br>  performanceComment: 'Buen rendimiento', athleteNotes: 'Me sentí fuerte'<br>};<br>await service.submitExerciseFeedback(feedbackDto);<br>expect(planCopy.save).toHaveBeenCalled();<br>``` |
| 20 | `debe actualizar la mediaUrl si se proporciona` | Guarda URL de archivo multimedia (video/imagen) | Campo mediaUrl actualizado | ```typescript<br>const feedbackDto = { ..., mediaUrl: 'uploads/video-123.mp4' };<br>await service.submitExerciseFeedback(feedbackDto);<br>expect(planCopy.sessions[0].exercises[0].mediaUrl).toBe('uploads/video-123.mp4');<br>``` |
| 21 | `debe lanzar NotFoundException si el plan no existe` | Valida existencia del plan | Lanza `NotFoundException` | ```typescript<br>await expect(service.submitExerciseFeedback(feedbackDto)).rejects.toThrow(<br>  new NotFoundException('Training plan con ID ... no encontrado')<br>);<br>``` |
| 22 | `debe lanzar error si el atleta no es el propietario del plan` | Valida autorización del atleta | Lanza error de autorización | ```typescript<br>const feedbackDto = { ..., athleteId: 'otro-atleta-id' };<br>await expect(service.submitExerciseFeedback(feedbackDto)).rejects.toThrow(<br>  new NotFoundException('No autorizado para actualizar este plan')<br>);<br>``` |
| 23 | `debe lanzar NotFoundException si la sesión no existe` | Valida existencia de la sesión | Lanza `NotFoundException` con mensaje 'Sesión no encontrada' | ```typescript<br>const feedbackDto = { ..., sessionId: 'S-INEXISTENTE' };<br>await expect(service.submitExerciseFeedback(feedbackDto)).rejects.toThrow(<br>  new NotFoundException('Sesión no encontrada')<br>);<br>``` |
| 24 | `debe lanzar NotFoundException si el ejercicio no existe` | Valida existencia del ejercicio | Lanza `NotFoundException` con mensaje 'Ejercicio no encontrado' | ```typescript<br>const feedbackDto = { ..., exerciseId: 'E-INEXISTENTE' };<br>await expect(service.submitExerciseFeedback(feedbackDto)).rejects.toThrow(<br>  new NotFoundException('Ejercicio no encontrado')<br>);<br>``` |
| 25 | `debe manejar completed como string "true"` | Convierte string a booleano | completed = true cuando recibe "true" | ```typescript<br>const feedbackDto: any = { ..., completed: 'true' };<br>await service.submitExerciseFeedback(feedbackDto);<br>expect(planCopy.sessions[0].exercises[0].completed).toBe(true);<br>``` |
| 26 | `debe manejar completed como string "false"` | Convierte string a booleano | completed = false cuando recibe "false" | ```typescript<br>const feedbackDto: any = { ..., completed: 'false' };<br>await service.submitExerciseFeedback(feedbackDto);<br>expect(planCopy.sessions[0].exercises[0].completed).toBe(false);<br>``` |

#### Método `updateSessionNotes(params)`

| # | Nombre de la Prueba | Descripción | Resultado Esperado | Código de Prueba |
|---|---------------------|-------------|--------------------|------------------|
| 27 | `debe actualizar las notas de una sesión` | Guarda notas generales de la sesión | sessionNotes actualizado | ```typescript<br>const notesDto = { planId, sessionId, sessionNotes: 'Sesión muy intensa' };<br>await service.updateSessionNotes(notesDto);<br>expect(planCopy.sessions[0].sessionNotes).toBe('Sesión muy intensa');<br>``` |
| 28 | `debe lanzar NotFoundException si el plan no existe` | Valida existencia del plan | Lanza `NotFoundException` | ```typescript<br>await expect(service.updateSessionNotes(notesDto)).rejects.toThrow(<br>  NotFoundException<br>);<br>``` |
| 29 | `debe validar que el atleta sea el propietario del plan` | Verifica autorización | Lanza error si athleteId no coincide | ```typescript<br>const notesDto = { ..., athleteId: 'otro-atleta' };<br>await expect(service.updateSessionNotes(notesDto)).rejects.toThrow(<br>  new NotFoundException('No autorizado para actualizar este plan')<br>);<br>``` |

#### Método `submitPerformedSets(params)`

| # | Nombre de la Prueba | Descripción | Resultado Esperado | Código de Prueba |
|---|---------------------|-------------|--------------------|------------------|
| 30 | `debe actualizar los sets realizados de un ejercicio` | Actualiza repsPerformed, loadUsed y completed de múltiples sets | Sets actualizados con datos de ejecución | ```typescript<br>const setsDto = {<br>  planId, sessionId, exerciseId,<br>  sets: [{ setId: 'PS-111111', completed: true, repsPerformed: 10, loadUsed: 80 }]<br>};<br>await service.submitPerformedSets(setsDto);<br>expect(planCopy.sessions[0].exercises[0].performedSets[0].completed).toBe(true);<br>``` |
| 31 | `debe marcar el ejercicio como completado si todos los sets están completados` | Lógica automática de completado | exercise.completed = true cuando todos los sets están completados | ```typescript<br>const setsDto = { sets: [<br>  { setId: 'PS-111111', completed: true },<br>  { setId: 'PS-222222', completed: true },<br>  { setId: 'PS-333333', completed: true },<br>  { setId: 'PS-444444', completed: true }<br>]};<br>await service.submitPerformedSets(setsDto);<br>expect(planCopy.sessions[0].exercises[0].completed).toBe(true);<br>``` |
| 32 | `debe lanzar NotFoundException si el ejercicio no existe` | Valida existencia del ejercicio | Lanza `NotFoundException` | ```typescript<br>const setsDto = { ..., exerciseId: 'E-INEXISTENTE' };<br>await expect(service.submitPerformedSets(setsDto)).rejects.toThrow(<br>  new NotFoundException('Ejercicio no encontrado')<br>);<br>``` |

#### Método `convertToTemplate(createTemplateFromPlanDto)`

| # | Nombre de la Prueba | Descripción | Resultado Esperado | Código de Prueba |
|---|---------------------|-------------|--------------------|------------------|
| 33 | `debe convertir un plan en plantilla` | Crea plantilla desde plan y marca el plan como template | Plan marcado con isTemplate: true y templateId | ```typescript<br>const convertDto = { planId, name, description, createdBy };<br>const result = await service.convertToTemplate(convertDto);<br>expect(mockTemplatesService.createFromTrainingPlan).toHaveBeenCalled();<br>expect(mockTrainingPlanModel.findByIdAndUpdate).toHaveBeenCalledWith(<br>  mockPlanId, { isTemplate: true, templateId: mockTemplateId }<br>);<br>``` |

#### Método `removeTemplateStatus(id)`

| # | Nombre de la Prueba | Descripción | Resultado Esperado | Código de Prueba |
|---|---------------------|-------------|--------------------|------------------|
| 34 | `debe quitar el estado de plantilla de un plan` | Desmarca plan como plantilla | isTemplate: false y templateId eliminado | ```typescript<br>const result = await service.removeTemplateStatus(mockPlanId);<br>expect(mockTrainingPlanModel.findByIdAndUpdate).toHaveBeenCalledWith(<br>  mockPlanId, { isTemplate: false, $unset: { templateId: 1 } }, { new: true }<br>);<br>``` |
| 35 | `debe lanzar NotFoundException si el plan no existe` | Valida existencia del plan | Lanza `NotFoundException` | ```typescript<br>await expect(service.removeTemplateStatus('id_inexistente')).rejects.toThrow(<br>  NotFoundException<br>);<br>``` |

#### Método `generateId(prefix)`

| # | Nombre de la Prueba | Descripción | Resultado Esperado | Código de Prueba |
|---|---------------------|-------------|--------------------|------------------|
| 36 | `debe generar IDs con el prefijo correcto` | Genera IDs con formato PREFIX-XXXXXX | IDs con prefijos S-, E-, PS- | ```typescript<br>const sessionId = service.generateId('S');<br>const exerciseId = service.generateId('E');<br>const setId = service.generateId('PS');<br>expect(sessionId).toMatch(/^S-[A-Z0-9]{6}$/);<br>``` |
| 37 | `debe generar IDs únicos` | No genera IDs duplicados | Cada llamada retorna un ID diferente | ```typescript<br>const id1 = service.generateId('S');<br>const id2 = service.generateId('S');<br>expect(id1).not.toBe(id2);<br>``` |

---

## TrainingPlansController

El `TrainingPlansController` maneja todos los endpoints HTTP del módulo más complejo de la aplicación, incluyendo CRUD, feedback de atletas, y dashboard de métricas.

### Archivo de pruebas
`training-plans.controller.spec.ts`

### Casos de Prueba

#### Validación del Controlador

| # | Nombre de la Prueba | Descripción | Resultado Esperado |
|---|---------------------|-------------|-------------------|
| 38 | `debe estar definido el controlador` | Verifica que el controlador TrainingPlansController se instancia correctamente | El controlador debe estar definido y no ser null |

#### Endpoint `POST /training-plans`

| # | Nombre de la Prueba | Descripción | Resultado Esperado | Código de Prueba |
|---|---------------------|-------------|--------------------|------------------|
| 39 | `debe crear un plan de entrenamiento` | Crea un plan básico mediante POST | Plan creado con código 201 | ```typescript<br>const createDto = { athleteId, coachId, name, startDate, endDate, sessions: [] };<br>const result = await controller.create(createDto);<br>expect(result).toEqual(mockTrainingPlan);<br>``` |
| 40 | `debe crear un plan con sesiones y ejercicios` | Crea un plan completo con estructura compleja | Plan con sesiones y ejercicios creado | ```typescript<br>const createDto = { sessions: [{ exercises: [{ name, sets, reps }] }] };<br>expect(result).toBeDefined();<br>``` |

#### Endpoint `GET /training-plans`

| # | Nombre de la Prueba | Descripción | Resultado Esperado | Código de Prueba |
|---|---------------------|-------------|--------------------|------------------|
| 41 | `debe retornar todos los planes sin filtros` | Obtiene todos los planes | Array de todos los planes | ```typescript<br>const result = await controller.findAll();<br>expect(service.findAll).toHaveBeenCalled();<br>``` |
| 42 | `debe retornar planes filtrados por athleteId` | Filtra por query param athleteId | Planes del atleta especificado | ```typescript<br>const result = await controller.findAll(mockAthleteId);<br>expect(service.findByAthleteId).toHaveBeenCalledWith(mockAthleteId);<br>``` |
| 43 | `debe retornar planes filtrados por coachId` | Filtra por query param coachId | Planes del coach especificado | ```typescript<br>const result = await controller.findAll(undefined, mockCoachId);<br>expect(service.findByCoachId).toHaveBeenCalledWith(mockCoachId);<br>``` |
| 44 | `debe retornar planes filtrados por coachId y athleteId` | Filtra por ambos query params | Planes de la relación coach-atleta | ```typescript<br>const result = await controller.findAll(mockAthleteId, mockCoachId);<br>expect(service.findByCoachAndAthlete).toHaveBeenCalledWith(mockCoachId, mockAthleteId);<br>``` |
| 45 | `debe priorizar filtro combinado sobre filtros individuales` | Verifica precedencia de filtros | Filtro combinado tiene prioridad | ```typescript<br>await controller.findAll(mockAthleteId, mockCoachId);<br>expect(service.findByCoachAndAthlete).toHaveBeenCalled();<br>expect(service.findByAthleteId).not.toHaveBeenCalled();<br>``` |

#### Endpoint `GET /training-plans/:id`

| # | Nombre de la Prueba | Descripción | Resultado Esperado | Código de Prueba |
|---|---------------------|-------------|--------------------|------------------|
| 46 | `debe retornar un plan por ID` | Obtiene plan específico | Objeto del plan con todos sus datos | ```typescript<br>const result = await controller.findOne(mockPlanId);<br>expect(result).toEqual(mockTrainingPlan);<br>``` |

#### Endpoint `PATCH /training-plans/:id`

| # | Nombre de la Prueba | Descripción | Resultado Esperado | Código de Prueba |
|---|---------------------|-------------|--------------------|------------------|
| 47 | `debe actualizar un plan de entrenamiento` | Actualiza campos del plan | Plan actualizado | ```typescript<br>const updateDto = { name: 'Plan Actualizado' };<br>const result = await controller.update(mockPlanId, updateDto);<br>expect(result.name).toBe('Plan Actualizado');<br>``` |
| 48 | `debe actualizar fechas del plan` | Actualiza startDate y endDate | Fechas actualizadas | ```typescript<br>const updateDto = { startDate: '2025-02-01', endDate: '2025-04-01' };<br>await controller.update(mockPlanId, updateDto);<br>``` |

#### Endpoint `DELETE /training-plans/:id`

| # | Nombre de la Prueba | Descripción | Resultado Esperado | Código de Prueba |
|---|---------------------|-------------|--------------------|------------------|
| 49 | `debe eliminar un plan de entrenamiento` | Elimina permanentemente un plan | Plan eliminado | ```typescript<br>await controller.remove(mockPlanId);<br>expect(service.remove).toHaveBeenCalledWith(mockPlanId);<br>``` |

#### Endpoint `POST /training-plans/:id/convert-to-template`

| # | Nombre de la Prueba | Descripción | Resultado Esperado | Código de Prueba |
|---|---------------------|-------------|--------------------|------------------|
| 50 | `debe convertir un plan en plantilla` | Convierte plan en plantilla reutilizable | Plantilla creada desde plan | ```typescript<br>const templateData = { name, description, createdBy };<br>const result = await controller.convertToTemplate(mockPlanId, templateData);<br>expect(service.convertToTemplate).toHaveBeenCalled();<br>``` |
| 51 | `debe incluir el planId en el DTO de conversión` | Combina planId del param con body | DTO completo con planId | ```typescript<br>await controller.convertToTemplate(mockPlanId, templateData);<br>expect(callArg.planId).toBe(mockPlanId);<br>``` |

#### Endpoint `PATCH /training-plans/:id/remove-template-status`

| # | Nombre de la Prueba | Descripción | Resultado Esperado | Código de Prueba |
|---|---------------------|-------------|--------------------|------------------|
| 52 | `debe quitar el estado de plantilla de un plan` | Desmarca plan como plantilla | Plan ya no es plantilla | ```typescript<br>const result = await controller.removeTemplateStatus(mockPlanId);<br>expect(result.isTemplate).toBe(false);<br>``` |

#### Endpoint `POST /training-plans/feedback/exercise`

| # | Nombre de la Prueba | Descripción | Resultado Esperado | Código de Prueba |
|---|---------------------|-------------|--------------------|------------------|
| 53 | `debe enviar feedback de ejercicio sin archivo` | Envía feedback textual | Feedback guardado sin mediaUrl | ```typescript<br>const feedbackDto = { planId, sessionId, exerciseId, completed: true };<br>const result = await controller.submitExerciseFeedback(feedbackDto, undefined, req);<br>expect(service.submitExerciseFeedback).toHaveBeenCalledWith({<br>  ...feedbackDto, athleteId: mockAthleteId, mediaUrl: undefined<br>});<br>``` |
| 54 | `debe enviar feedback de ejercicio con archivo multimedia` | Envía feedback con video/imagen | Feedback guardado con mediaUrl | ```typescript<br>const mockFile = { filename: 'video-123.mp4' };<br>await controller.submitExerciseFeedback(feedbackDto, mockFile, req);<br>expect(service.submitExerciseFeedback).toHaveBeenCalledWith({<br>  ..., mediaUrl: 'uploads/video-123.mp4'<br>});<br>``` |
| 55 | `debe extraer el athleteId del usuario autenticado` | Usa userId del token JWT | athleteId extraído del request | ```typescript<br>const mockRequest = { user: { userId: 'custom-athlete-id' } };<br>await controller.submitExerciseFeedback(feedbackDto, undefined, mockRequest);<br>expect(callArg.athleteId).toBe('custom-athlete-id');<br>``` |

#### Endpoint `PATCH /training-plans/feedback/session-notes`

| # | Nombre de la Prueba | Descripción | Resultado Esperado | Código de Prueba |
|---|---------------------|-------------|--------------------|------------------|
| 56 | `debe actualizar las notas de una sesión` | Guarda notas generales de sesión | Notas actualizadas | ```typescript<br>const notesDto = { planId, sessionId, sessionNotes: 'Sesión muy intensa' };<br>const result = await controller.updateSessionNotes(notesDto, req);<br>expect(service.updateSessionNotes).toHaveBeenCalled();<br>``` |

#### Endpoint `PATCH /training-plans/feedback/exercise-sets`

| # | Nombre de la Prueba | Descripción | Resultado Esperado | Código de Prueba |
|---|---------------------|-------------|--------------------|------------------|
| 57 | `debe actualizar los sets realizados de un ejercicio` | Actualiza datos de ejecución de sets | Sets actualizados | ```typescript<br>const setsDto = {<br>  planId, sessionId, exerciseId,<br>  sets: [{ setId, completed: true, repsPerformed: 10, loadUsed: 80 }]<br>};<br>await controller.submitPerformedSets(setsDto, req);<br>expect(service.submitPerformedSets).toHaveBeenCalled();<br>``` |
| 58 | `debe pasar múltiples sets en la actualización` | Maneja actualización de múltiples sets | Todos los sets actualizados | ```typescript<br>const setsDto = { sets: [set1, set2, set3] };<br>await controller.submitPerformedSets(setsDto, req);<br>expect(callArg.sets).toHaveLength(3);<br>``` |

#### Endpoint `GET /training-plans/dashboard/:coachId`

| # | Nombre de la Prueba | Descripción | Resultado Esperado | Código de Prueba |
|---|---------------------|-------------|--------------------|------------------|
| 59 | `debe retornar estadísticas del dashboard para un coach` | Calcula métricas completas del dashboard | Objeto con stats, weeklyProgress, upcomingSessions, sessionDistribution | ```typescript<br>const result = await controller.getDashboardStats(mockCoachId, req);<br>expect(result.stats).toBeDefined();<br>expect(result.stats.activePlans).toBeDefined();<br>expect(result.weeklyProgress).toBeDefined();<br>``` |
| 60 | `debe lanzar UnauthorizedException si el usuario no es coach` | Valida rol de usuario | Lanza error si role !== 'coach' | ```typescript<br>const mockRequest = { user: { role: 'athlete' } };<br>await expect(controller.getDashboardStats(mockCoachId, mockRequest))<br>  .rejects.toThrow(new UnauthorizedException('Solo los coaches pueden acceder al dashboard'));<br>``` |
| 61 | `debe lanzar UnauthorizedException si el coach intenta acceder a dashboard de otro coach` | Valida propiedad del dashboard | Lanza error si coachId no coincide | ```typescript<br>const mockRequest = { user: { role: 'coach', coachId: 'otro-coach-id' } };<br>await expect(controller.getDashboardStats(mockCoachId, mockRequest))<br>  .rejects.toThrow(new UnauthorizedException('No autorizado para acceder a este dashboard'));<br>``` |
| 62 | `debe calcular correctamente el número de planes activos` | Cuenta planes con sesiones incompletas | Número correcto de planes activos | ```typescript<br>const mockPlans = [planConSesionesIncompletas, planTodoCompleto];<br>const result = await controller.getDashboardStats(mockCoachId, req);<br>expect(result.stats.activePlans).toBe(1);<br>``` |
| 63 | `debe generar progreso semanal con 7 días` | Crea array de progreso diario | Array con 7 elementos (uno por día) | ```typescript<br>const result = await controller.getDashboardStats(mockCoachId, req);<br>expect(result.weeklyProgress).toHaveLength(7);<br>``` |
| 64 | `debe incluir distribución de sesiones` | Calcula distribución por estado | Array con 3 categorías: Completadas, Próximas, Pendientes | ```typescript<br>const result = await controller.getDashboardStats(mockCoachId, req);<br>expect(result.sessionDistribution).toHaveLength(3);<br>expect(result.sessionDistribution[0].name).toBe('Completadas');<br>``` |
| 65 | `debe ordenar sesiones próximas por fecha` | Ordena cronológicamente | Primera sesión es la más cercana en el tiempo | ```typescript<br>const result = await controller.getDashboardStats(mockCoachId, req);<br>expect(result.upcomingSessions[0].sessionName).toBe('Sesión 1');<br>``` |
| 66 | `debe limitar sesiones próximas a 5` | Muestra máximo 5 sesiones | Array con máximo 5 elementos | ```typescript<br>const mockPlans = [{ sessions: [...10sesiones] }];<br>const result = await controller.getDashboardStats(mockCoachId, req);<br>expect(result.upcomingSessions.length).toBeLessThanOrEqual(5);<br>``` |

---

## Ejecutar las Pruebas

### Ejecutar todas las pruebas del módulo de training-plans
```bash
npm test -- training-plans
```

### Ejecutar pruebas de un archivo específico
```bash
# TrainingPlansService
npm test -- training-plans.service.spec.ts

# TrainingPlansController
npm test -- training-plans.controller.spec.ts
```

### Ejecutar con cobertura de código
```bash
npm test -- training-plans --coverage
```

### Modo watch (desarrollo)
```bash
npm test -- training-plans --watch
```

---

## Resumen de Cobertura

El módulo de training-plans cuenta con **66 pruebas unitarias** que cubren:

| Componente | Pruebas | Funcionalidades Cubiertas |
|------------|---------|---------------------------|
| **TrainingPlansService** | 37 | Creación con IDs automáticos, CRUD completo, feedback de atletas, seguimiento de sets, conversión a plantillas, validaciones de autorización |
| **TrainingPlansController** | 29 | Todos los endpoints REST, dashboard de métricas, subida de archivos, filtros múltiples, autorización por roles |
| **TOTAL** | **66** | **Cobertura completa del módulo más complejo de la aplicación** |

---

## Funcionalidades Probadas

### TrainingPlansService

#### Gestión de Planes
- ✅ Creación de planes con generación automática de IDs (sesiones, ejercicios, sets)
- ✅ Inicialización de performedSets vacíos
- ✅ Consulta de todos los planes con populate de atletas
- ✅ Búsqueda por ID con populate
- ✅ Filtrado por atleta
- ✅ Filtrado por coach
- ✅ Filtrado combinado coach-atleta
- ✅ Actualización completa y parcial
- ✅ Actualización preservando IDs existentes
- ✅ Conversión de fechas string a Date
- ✅ Eliminación permanente

#### Feedback de Atletas
- ✅ Envío de feedback de ejercicio (completed, comments, notes)
- ✅ Subida de archivos multimedia (videos/imágenes)
- ✅ Actualización de notas de sesión
- ✅ Actualización de sets realizados (reps, load, completed)
- ✅ Marcado automático de ejercicio completado
- ✅ Recálculo automático de estado de sesión
- ✅ Validación de autorización (solo el atleta propietario)
- ✅ Manejo de valores booleanos como strings
- ✅ Búsqueda de sesiones y ejercicios por IDs lógicos

#### Plantillas
- ✅ Conversión de plan a plantilla
- ✅ Marcado de plan como plantilla
- ✅ Remoción de estado de plantilla

#### Utilidades
- ✅ Generación de IDs únicos con prefijos
- ✅ Formato correcto de IDs (PREFIX-XXXXXX)

### TrainingPlansController

#### Endpoints CRUD
- ✅ POST crear plan
- ✅ GET listar con filtros opcionales (athleteId, coachId, ambos)
- ✅ GET plan individual por ID
- ✅ PATCH actualizar plan
- ✅ DELETE eliminar plan

#### Endpoints de Feedback
- ✅ POST feedback de ejercicio (con/sin archivo)
- ✅ PATCH notas de sesión
- ✅ PATCH sets realizados
- ✅ Extracción de athleteId desde JWT
- ✅ Manejo de archivos multimedia con Multer

#### Endpoints de Plantillas
- ✅ POST convertir plan a plantilla
- ✅ PATCH remover estado de plantilla
- ✅ Composición correcta de DTOs

#### Dashboard de Coach
- ✅ GET estadísticas del dashboard
- ✅ Cálculo de planes activos
- ✅ Cálculo de sesiones completadas en la semana
- ✅ Tasa de completado
- ✅ Progreso semanal (7 días)
- ✅ Sesiones próximas (ordenadas, limitadas a 5)
- ✅ Distribución de sesiones por estado
- ✅ Validación de rol (solo coaches)
- ✅ Validación de propiedad del dashboard

---

## Estructura de Datos

### TrainingPlan Schema
```typescript
{
  athleteId: ObjectId (ref: User),
  coachId: string,
  name: string,
  startDate: Date,
  endDate: Date,
  isTemplate: boolean,
  templateId: ObjectId (ref: Template),
  sessions: [
    {
      sessionId: string,       // ID lógico: S-XXXXXX
      sessionName: string,
      date: string,
      sessionNotes: string,
      completed: boolean,
      exercises: [
        {
          exerciseId: string,  // ID lógico: E-XXXXXX
          name: string,
          sets: number,
          reps: number,
          rpe/rir/rm: number,
          weight: number,
          completed: boolean,
          performanceComment: string,
          mediaUrl: string,
          athleteNotes: string,
          performedSets: [
            {
              setId: string,   // ID lógico: PS-XXXXXX
              setNumber: number,
              repsPerformed: number,
              loadUsed: number,
              measureAchieved: number,
              completed: boolean
            }
          ]
        }
      ]
    }
  ]
}
```

---

## IDs Lógicos

El sistema utiliza IDs lógicos generados por la aplicación para identificar sesiones, ejercicios y sets de forma estable antes de la persistencia:

| Prefijo | Tipo | Formato | Ejemplo |
|---------|------|---------|---------|
| `S-` | Sesión | S-XXXXXX | S-ABC123 |
| `E-` | Ejercicio | E-XXXXXX | E-DEF456 |
| `PS-` | Performed Set | PS-XXXXXX | PS-GHI789 |

Estos IDs permiten:
- Identificar elementos antes de guardar en BD
- Actualizar elementos específicos sin depender de índices de array
- Mantener consistencia en actualizaciones parciales

---

## Dashboard de Métricas

El dashboard de coaches calcula y retorna:

### Estadísticas Principales
- **activePlans**: Número de planes con sesiones pendientes
- **completedSessionsThisWeek**: Sesiones completadas en los últimos 7 días
- **completionRate**: Porcentaje de completado semanal
- **totalSessions**: Total de sesiones en todos los planes

### Progreso Semanal
Array de 7 días con:
- **day**: Nombre del día (Lun, Mar, Mié, etc.)
- **completed**: Sesiones completadas ese día
- **scheduled**: Sesiones programadas ese día

### Sesiones Próximas
Top 5 sesiones de los próximos 7 días:
- **id**: Identificador compuesto
- **athleteName**: Nombre del atleta
- **sessionName**: Nombre de la sesión
- **date**: Fecha de la sesión
- **time**: Hora programada
- **status**: Estado (scheduled)

### Distribución de Sesiones
- **Completadas**: Sesiones finalizadas (color: #D72638)
- **Próximas (7 días)**: Sesiones en los próximos 7 días (color: #F5B700)
- **Pendientes**: Otras sesiones no completadas (color: #5A5A5A)

---

## Validaciones de Seguridad

### Autorización de Atletas
- Solo el atleta propietario puede enviar feedback
- Validación: `String(plan.athleteId) === String(athleteId)`
- Error: `NotFoundException('No autorizado para actualizar este plan')`

### Autorización de Coaches
- Solo el coach propietario puede ver su dashboard
- Validación de rol: `req.user.role === 'coach'`
- Validación de propiedad: `req.user.coachId === coachId`
- Errores específicos según tipo de violación

---

## Dependencias de Testing

- `@nestjs/testing` - Framework de testing de NestJS
- `jest` - Framework de pruebas unitarias
- `@nestjs/mongoose` - Para mockear modelos de Mongoose
- `ts-jest` - Soporte de TypeScript para Jest

---

## Mocks Utilizados

### Modelos
- `TrainingPlan Model`: Mockeado como función constructora con métodos CRUD
- `Templates Service`: Mockeado para conversión a plantillas

### Datos de Prueba
- Planes completos con sesiones y ejercicios
- Atletas con datos populados
- Sets con estados de completado variados
- Archivos multimedia para feedback
