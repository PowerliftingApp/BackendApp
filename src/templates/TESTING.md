# Pruebas Unitarias - Módulo de Templates (Plantillas)

Este documento contiene la documentación de todas las pruebas unitarias implementadas para el módulo de plantillas de entrenamiento del sistema Powerlift.

## Índice
- [TemplatesService](#templatesservice)
- [TemplatesController](#templatescontroller)
- [Ejecutar las pruebas](#ejecutar-las-pruebas)

---

## TemplatesService

El `TemplatesService` es responsable de gestionar las plantillas de entrenamiento, incluyendo creación, consulta, actualización y eliminación.

### Archivo de pruebas
`templates.service.spec.ts`

### Casos de Prueba

#### Validación del Servicio

| # | Nombre de la Prueba | Descripción | Resultado Esperado |
|---|---------------------|-------------|-------------------|
| 1 | `debe estar definido el servicio` | Verifica que el servicio TemplatesService se instancia correctamente | El servicio debe estar definido y no ser null |

#### Método `create(createTemplateDto)`

| # | Nombre de la Prueba | Descripción | Resultado Esperado | Código de Prueba |
|---|---------------------|-------------|--------------------|------------------|
| 2 | `debe crear una nueva plantilla correctamente` | Verifica la creación de una plantilla con todos sus datos | Retorna la plantilla creada con ID asignado | ```typescript<br>const createDto = { name, description, type, createdBy, sessions };<br>const result = await service.create(createDto);<br>expect(result).toBeDefined();<br>``` |
| 3 | `debe establecer isActive en true por defecto` | Verifica que las plantillas nuevas se crean activas | Campo `isActive` es `true` si no se especifica | ```typescript<br>await service.create(createDto);<br>// Plantilla creada con isActive: true<br>``` |

#### Método `findAll()`

| # | Nombre de la Prueba | Descripción | Resultado Esperado | Código de Prueba |
|---|---------------------|-------------|--------------------|------------------|
| 4 | `debe retornar todas las plantillas activas` | Obtiene todas las plantillas con isActive=true | Array de plantillas activas | ```typescript<br>const result = await service.findAll();<br>expect(result).toEqual(mockTemplates);<br>expect(mockTemplateModel.find).toHaveBeenCalledWith({ isActive: true });<br>``` |
| 5 | `debe ordenar las plantillas por fecha de creación descendente` | Verifica el orden de las plantillas | Plantillas ordenadas por createdAt: -1 | ```typescript<br>await service.findAll();<br>expect(sortMock).toHaveBeenCalledWith({ createdAt: -1 });<br>``` |

#### Método `findByType(type)`

| # | Nombre de la Prueba | Descripción | Resultado Esperado | Código de Prueba |
|---|---------------------|-------------|--------------------|------------------|
| 6 | `debe retornar plantillas filtradas por tipo` | Filtra plantillas por tipo PREDEFINED o USER_CREATED | Array de plantillas del tipo especificado | ```typescript<br>const result = await service.findByType(TemplateType.PREDEFINED);<br>expect(mockTemplateModel.find).toHaveBeenCalledWith({ <br>  type: TemplateType.PREDEFINED, isActive: true <br>});<br>``` |
| 7 | `debe retornar plantillas creadas por usuario` | Filtra plantillas tipo USER_CREATED | Array de plantillas de usuario | ```typescript<br>const result = await service.findByType(TemplateType.USER_CREATED);<br>expect(result).toEqual([mockTemplate]);<br>``` |

#### Método `findPredefined()`

| # | Nombre de la Prueba | Descripción | Resultado Esperado | Código de Prueba |
|---|---------------------|-------------|--------------------|------------------|
| 8 | `debe retornar solo plantillas predefinidas` | Obtiene únicamente plantillas del sistema | Array de plantillas predefinidas activas | ```typescript<br>const result = await service.findPredefined();<br>expect(mockTemplateModel.find).toHaveBeenCalledWith({ <br>  type: TemplateType.PREDEFINED, isActive: true <br>});<br>``` |
| 9 | `debe ordenar por categoría predefinida` | Verifica ordenamiento por predefinedCategory | Plantillas ordenadas por categoría | ```typescript<br>await service.findPredefined();<br>expect(sortMock).toHaveBeenCalledWith({ predefinedCategory: 1 });<br>``` |

#### Método `findByCreator(createdBy)`

| # | Nombre de la Prueba | Descripción | Resultado Esperado | Código de Prueba |
|---|---------------------|-------------|--------------------|------------------|
| 10 | `debe retornar plantillas creadas por un usuario específico` | Filtra plantillas por el ID del creador | Array de plantillas del usuario | ```typescript<br>const result = await service.findByCreator(mockUserId);<br>expect(mockTemplateModel.find).toHaveBeenCalledWith({ <br>  createdBy: mockUserId, type: USER_CREATED, isActive: true <br>});<br>``` |
| 11 | `debe retornar array vacío si el usuario no tiene plantillas` | Maneja caso sin plantillas | Array vacío | ```typescript<br>const result = await service.findByCreator('userId_sin_plantillas');<br>expect(result).toEqual([]);<br>``` |

#### Método `findOne(id)`

| # | Nombre de la Prueba | Descripción | Resultado Esperado | Código de Prueba |
|---|---------------------|-------------|--------------------|------------------|
| 12 | `debe retornar una plantilla por ID` | Busca y retorna una plantilla específica | Objeto de la plantilla | ```typescript<br>const result = await service.findOne(mockTemplateId);<br>expect(result).toEqual(mockTemplate);<br>expect(mockTemplateModel.findById).toHaveBeenCalledWith(mockTemplateId);<br>``` |
| 13 | `debe lanzar NotFoundException si la plantilla no existe` | Maneja plantillas no encontradas | Lanza `NotFoundException` con mensaje descriptivo | ```typescript<br>await expect(service.findOne('id_inexistente')).rejects.toThrow(<br>  new NotFoundException('Plantilla con ID id_inexistente no encontrada')<br>);<br>``` |

#### Método `update(id, updateTemplateDto)`

| # | Nombre de la Prueba | Descripción | Resultado Esperado | Código de Prueba |
|---|---------------------|-------------|--------------------|------------------|
| 14 | `debe actualizar una plantilla correctamente` | Actualiza los campos de una plantilla | Plantilla actualizada | ```typescript<br>const updateDto = { name: 'Nombre Actualizado', description: '...' };<br>const result = await service.update(mockTemplateId, updateDto);<br>expect(result).toEqual(updatedTemplate);<br>``` |
| 15 | `debe lanzar NotFoundException si la plantilla no existe` | Maneja actualizaciones de plantillas inexistentes | Lanza `NotFoundException` | ```typescript<br>await expect(service.update('id_inexistente', { name: 'Nuevo' }))<br>  .rejects.toThrow(NotFoundException);<br>``` |

#### Método `remove(id)`

| # | Nombre de la Prueba | Descripción | Resultado Esperado | Código de Prueba |
|---|---------------------|-------------|--------------------|------------------|
| 16 | `debe eliminar una plantilla de usuario (soft delete)` | Marca isActive=false sin borrar el registro | Plantilla desactivada (isActive: false) | ```typescript<br>await service.remove(mockTemplateId);<br>expect(templateToDelete.isActive).toBe(false);<br>expect(templateToDelete.save).toHaveBeenCalled();<br>``` |
| 17 | `debe lanzar BadRequestException al intentar eliminar plantilla predefinida` | Protege plantillas del sistema | Lanza `BadRequestException` con mensaje específico | ```typescript<br>await expect(service.remove(predefinedId)).rejects.toThrow(<br>  new BadRequestException('No se pueden eliminar plantillas predefinidas del sistema')<br>);<br>``` |
| 18 | `debe lanzar NotFoundException si la plantilla no existe` | Maneja eliminación de plantillas inexistentes | Lanza `NotFoundException` | ```typescript<br>await expect(service.remove('id_inexistente')).rejects.toThrow(<br>  NotFoundException<br>);<br>``` |
| 19 | `debe desmarcar el plan original al eliminar plantilla` | Actualiza el plan de entrenamiento asociado | Plan marcado como isTemplate: false | ```typescript<br>await service.remove(mockTemplateId);<br>expect(mockTrainingPlanModel.findByIdAndUpdate).toHaveBeenCalledWith(<br>  mockPlanId, { isTemplate: false, $unset: { templateId: 1 } }<br>);<br>``` |

#### Método `createFromTrainingPlan(createTemplateFromPlanDto)`

| # | Nombre de la Prueba | Descripción | Resultado Esperado | Código de Prueba |
|---|---------------------|-------------|--------------------|------------------|
| 20 | `debe crear una plantilla desde un plan de entrenamiento` | Convierte un plan en plantilla | Plantilla creada con sesiones del plan | ```typescript<br>const dto = { planId, name, description, createdBy };<br>const result = await service.createFromTrainingPlan(dto);<br>expect(result).toBeDefined();<br>expect(mockTrainingPlanModel.findById).toHaveBeenCalledWith(planId);<br>``` |
| 21 | `debe lanzar NotFoundException si el plan no existe` | Valida existencia del plan origen | Lanza `NotFoundException` con mensaje del plan | ```typescript<br>await expect(service.createFromTrainingPlan(dto)).rejects.toThrow(<br>  new NotFoundException('Plan de entrenamiento con ID ... no encontrado')<br>);<br>``` |

#### Método `incrementUsage(id)`

| # | Nombre de la Prueba | Descripción | Resultado Esperado | Código de Prueba |
|---|---------------------|-------------|--------------------|------------------|
| 22 | `debe incrementar el contador de uso de una plantilla` | Incrementa usageCount en 1 | Campo usageCount aumenta | ```typescript<br>await service.incrementUsage(mockTemplateId);<br>expect(mockTemplateModel.findByIdAndUpdate).toHaveBeenCalledWith(<br>  mockTemplateId, { $inc: { usageCount: 1 } }<br>);<br>``` |

#### Método `getMostUsed(limit)`

| # | Nombre de la Prueba | Descripción | Resultado Esperado | Código de Prueba |
|---|---------------------|-------------|--------------------|------------------|
| 23 | `debe retornar las plantillas más utilizadas con límite por defecto` | Obtiene top 10 plantillas más usadas | Array de hasta 10 plantillas ordenadas por usageCount | ```typescript<br>const result = await service.getMostUsed();<br>expect(result).toEqual(mostUsedTemplates);<br>expect(mockTemplateModel.find).toHaveBeenCalledWith({ isActive: true });<br>``` |
| 24 | `debe retornar las plantillas más utilizadas con límite personalizado` | Permite especificar cantidad de resultados | Array limitado al número especificado | ```typescript<br>await service.getMostUsed(5);<br>expect(limitMock).toHaveBeenCalledWith(5);<br>``` |
| 25 | `debe ordenar por usageCount descendente` | Verifica orden por popularidad | Plantillas ordenadas de mayor a menor uso | ```typescript<br>await service.getMostUsed();<br>expect(sortMock).toHaveBeenCalledWith({ usageCount: -1 });<br>``` |

#### Método `createPredefinedTemplates()`

| # | Nombre de la Prueba | Descripción | Resultado Esperado | Código de Prueba |
|---|---------------------|-------------|--------------------|------------------|
| 26 | `debe crear plantillas predefinidas si no existen` | Inicializa plantillas del sistema | Plantillas predefinidas creadas en base de datos | ```typescript<br>await service.createPredefinedTemplates();<br>expect(mockTemplateModel.insertMany).toHaveBeenCalled();<br>``` |
| 27 | `no debe crear plantillas predefinidas si ya existen` | Evita duplicados en inicialización | No se insertan plantillas | ```typescript<br>await service.createPredefinedTemplates();<br>expect(mockTemplateModel.insertMany).not.toHaveBeenCalled();<br>``` |

---

## TemplatesController

El `TemplatesController` maneja las peticiones HTTP relacionadas con las plantillas de entrenamiento.

### Archivo de pruebas
`templates.controller.spec.ts`

### Casos de Prueba

#### Validación del Controlador

| # | Nombre de la Prueba | Descripción | Resultado Esperado |
|---|---------------------|-------------|-------------------|
| 28 | `debe estar definido el controlador` | Verifica que el controlador TemplatesController se instancia correctamente | El controlador debe estar definido y no ser null |

#### Endpoint `POST /templates`

| # | Nombre de la Prueba | Descripción | Resultado Esperado | Código de Prueba |
|---|---------------------|-------------|--------------------|------------------|
| 29 | `debe crear una nueva plantilla` | Crea una plantilla mediante POST | Plantilla creada con código 201 | ```typescript<br>const createDto = { name, description, type, createdBy, sessions };<br>const result = await controller.create(createDto);<br>expect(result).toEqual(mockTemplate);<br>expect(service.create).toHaveBeenCalledWith(createDto);<br>``` |
| 30 | `debe crear una plantilla con todas las propiedades` | Verifica creación con datos completos | Plantilla con todos los campos | ```typescript<br>const result = await controller.create(createDto);<br>expect(result).toBeDefined();<br>``` |

#### Endpoint `POST /templates/from-plan`

| # | Nombre de la Prueba | Descripción | Resultado Esperado | Código de Prueba |
|---|---------------------|-------------|--------------------|------------------|
| 31 | `debe crear una plantilla desde un plan de entrenamiento` | Convierte un plan en plantilla vía API | Plantilla creada basada en el plan | ```typescript<br>const dto = { planId, name, description, createdBy };<br>const result = await controller.createFromPlan(dto);<br>expect(result).toEqual(mockTemplate);<br>``` |

#### Endpoint `GET /templates`

| # | Nombre de la Prueba | Descripción | Resultado Esperado | Código de Prueba |
|---|---------------------|-------------|--------------------|------------------|
| 32 | `debe retornar todas las plantillas sin filtros` | Obtiene todas las plantillas activas | Array de todas las plantillas | ```typescript<br>const result = await controller.findAll();<br>expect(result).toEqual(mockTemplates);<br>expect(service.findAll).toHaveBeenCalled();<br>``` |
| 33 | `debe retornar plantillas predefinidas cuando predefined=true` | Filtra solo plantillas del sistema | Array de plantillas predefinidas | ```typescript<br>const result = await controller.findAll(undefined, undefined, 'true');<br>expect(service.findPredefined).toHaveBeenCalled();<br>``` |
| 34 | `debe retornar plantillas filtradas por tipo` | Aplica filtro de tipo en query params | Plantillas del tipo especificado | ```typescript<br>const result = await controller.findAll(TemplateType.USER_CREATED);<br>expect(service.findByType).toHaveBeenCalledWith(TemplateType.USER_CREATED);<br>``` |
| 35 | `debe retornar plantillas filtradas por creador` | Aplica filtro de creador en query params | Plantillas del usuario especificado | ```typescript<br>const result = await controller.findAll(undefined, mockUserId);<br>expect(service.findByCreator).toHaveBeenCalledWith(mockUserId);<br>``` |
| 36 | `debe priorizar predefined sobre otros filtros` | Verifica precedencia de filtros | Filtro predefined tiene prioridad | ```typescript<br>const result = await controller.findAll(type, userId, 'true');<br>expect(service.findPredefined).toHaveBeenCalled();<br>expect(service.findByType).not.toHaveBeenCalled();<br>``` |

#### Endpoint `GET /templates/most-used`

| # | Nombre de la Prueba | Descripción | Resultado Esperado | Código de Prueba |
|---|---------------------|-------------|--------------------|------------------|
| 37 | `debe retornar las plantillas más utilizadas con límite por defecto` | Obtiene top plantillas sin especificar límite | Top 10 plantillas más usadas | ```typescript<br>const result = await controller.getMostUsed();<br>expect(service.getMostUsed).toHaveBeenCalledWith(10);<br>``` |
| 38 | `debe retornar las plantillas más utilizadas con límite personalizado` | Obtiene top N plantillas | N plantillas más usadas | ```typescript<br>const result = await controller.getMostUsed('5');<br>expect(service.getMostUsed).toHaveBeenCalledWith(5);<br>``` |
| 39 | `debe manejar límites como string y convertirlos a número` | Convierte query params string a número | Límite procesado como número | ```typescript<br>await controller.getMostUsed('15');<br>expect(service.getMostUsed).toHaveBeenCalledWith(15);<br>``` |

#### Endpoint `GET /templates/predefined`

| # | Nombre de la Prueba | Descripción | Resultado Esperado | Código de Prueba |
|---|---------------------|-------------|--------------------|------------------|
| 40 | `debe retornar solo plantillas predefinidas` | Endpoint dedicado a plantillas del sistema | Array de plantillas predefinidas | ```typescript<br>const result = await controller.findPredefined();<br>expect(result).toEqual([mockPredefinedTemplate]);<br>``` |

#### Endpoint `GET /templates/by-type/:type`

| # | Nombre de la Prueba | Descripción | Resultado Esperado | Código de Prueba |
|---|---------------------|-------------|--------------------|------------------|
| 41 | `debe retornar plantillas filtradas por tipo PREDEFINED` | Filtra por tipo en URL param | Plantillas predefinidas | ```typescript<br>const result = await controller.findByType(TemplateType.PREDEFINED);<br>expect(service.findByType).toHaveBeenCalledWith(TemplateType.PREDEFINED);<br>``` |
| 42 | `debe retornar plantillas filtradas por tipo USER_CREATED` | Filtra por tipo en URL param | Plantillas de usuario | ```typescript<br>const result = await controller.findByType(TemplateType.USER_CREATED);<br>expect(service.findByType).toHaveBeenCalledWith(TemplateType.USER_CREATED);<br>``` |

#### Endpoint `GET /templates/by-creator/:createdBy`

| # | Nombre de la Prueba | Descripción | Resultado Esperado | Código de Prueba |
|---|---------------------|-------------|--------------------|------------------|
| 43 | `debe retornar plantillas creadas por un usuario específico` | Filtra por ID de usuario creador | Plantillas del usuario | ```typescript<br>const result = await controller.findByCreator(mockUserId);<br>expect(service.findByCreator).toHaveBeenCalledWith(mockUserId);<br>``` |
| 44 | `debe retornar array vacío si el usuario no tiene plantillas` | Maneja usuarios sin plantillas | Array vacío | ```typescript<br>const result = await controller.findByCreator('userId_sin_plantillas');<br>expect(result).toEqual([]);<br>``` |

#### Endpoint `GET /templates/:id`

| # | Nombre de la Prueba | Descripción | Resultado Esperado | Código de Prueba |
|---|---------------------|-------------|--------------------|------------------|
| 45 | `debe retornar una plantilla por ID` | Obtiene plantilla específica | Objeto de la plantilla | ```typescript<br>const result = await controller.findOne(mockTemplateId);<br>expect(result).toEqual(mockTemplate);<br>``` |

#### Endpoint `PATCH /templates/:id`

| # | Nombre de la Prueba | Descripción | Resultado Esperado | Código de Prueba |
|---|---------------------|-------------|--------------------|------------------|
| 46 | `debe actualizar una plantilla correctamente` | Actualiza campos de una plantilla | Plantilla actualizada | ```typescript<br>const updateDto = { name: 'Actualizado', description: '...' };<br>const result = await controller.update(mockTemplateId, updateDto);<br>expect(result).toEqual(updatedTemplate);<br>``` |
| 47 | `debe actualizar parcialmente una plantilla` | Permite actualizaciones parciales | Solo campos especificados son actualizados | ```typescript<br>const updateDto = { name: 'Solo Nombre' };<br>const result = await controller.update(mockTemplateId, updateDto);<br>expect(result.name).toBe('Solo Nombre');<br>``` |

#### Endpoint `PATCH /templates/:id/increment-usage`

| # | Nombre de la Prueba | Descripción | Resultado Esperado | Código de Prueba |
|---|---------------------|-------------|--------------------|------------------|
| 48 | `debe incrementar el contador de uso de una plantilla` | Incrementa usageCount al usar plantilla | Contador incrementado | ```typescript<br>await controller.incrementUsage(mockTemplateId);<br>expect(service.incrementUsage).toHaveBeenCalledWith(mockTemplateId);<br>``` |

#### Endpoint `DELETE /templates/:id`

| # | Nombre de la Prueba | Descripción | Resultado Esperado | Código de Prueba |
|---|---------------------|-------------|--------------------|------------------|
| 49 | `debe eliminar una plantilla (soft delete)` | Desactiva plantilla sin borrarla | Plantilla marcada como inactiva | ```typescript<br>await controller.remove(mockTemplateId);<br>expect(service.remove).toHaveBeenCalledWith(mockTemplateId);<br>``` |
| 50 | `debe pasar el ID correcto al servicio` | Verifica manejo correcto del parámetro ID | ID correcto pasado al servicio | ```typescript<br>await controller.remove(customId);<br>expect(service.remove).toHaveBeenCalledWith(customId);<br>``` |

---

## Ejecutar las Pruebas

### Ejecutar todas las pruebas del módulo de templates
```bash
npm test -- templates
```

### Ejecutar pruebas de un archivo específico
```bash
# TemplatesService
npm test -- templates.service.spec.ts

# TemplatesController
npm test -- templates.controller.spec.ts
```

### Ejecutar con cobertura de código
```bash
npm test -- templates --coverage
```

### Modo watch (desarrollo)
```bash
npm test -- templates --watch
```

---

## Resumen de Cobertura

El módulo de templates cuenta con **50 pruebas unitarias** que cubren:

| Componente | Pruebas | Funcionalidades Cubiertas |
|------------|---------|---------------------------|
| **TemplatesService** | 27 | Creación, consultas, actualización, eliminación, conversión desde planes, estadísticas de uso |
| **TemplatesController** | 23 | Todos los endpoints REST, filtros, query params, validación de datos |
| **TOTAL** | **50** | **Cobertura completa de funcionalidades esenciales** |

---

## Funcionalidades Probadas

### TemplatesService
- ✅ Creación de plantillas personalizadas
- ✅ Creación de plantillas desde planes existentes
- ✅ Consulta de todas las plantillas
- ✅ Filtrado por tipo (predefinidas/usuario)
- ✅ Filtrado por creador
- ✅ Búsqueda por ID
- ✅ Actualización de plantillas
- ✅ Eliminación soft delete
- ✅ Protección de plantillas predefinidas
- ✅ Contador de uso
- ✅ Top plantillas más utilizadas
- ✅ Inicialización de plantillas predefinidas

### TemplatesController
- ✅ POST crear plantilla
- ✅ POST crear desde plan
- ✅ GET listar con filtros opcionales
- ✅ GET plantillas más usadas
- ✅ GET plantillas predefinidas
- ✅ GET por tipo
- ✅ GET por creador
- ✅ GET por ID
- ✅ PATCH actualizar
- ✅ PATCH incrementar uso
- ✅ DELETE eliminar (soft)

---

## Tipos de Plantillas

### Plantillas Predefinidas del Sistema
- **FUERZA_BASICO**: Ejercicios compuestos para desarrollo de fuerza
- **HIPERTROFIA**: Mayor volumen para crecimiento muscular
- **RESISTENCIA**: Enfoque en resistencia cardiovascular y muscular

### Plantillas Creadas por Usuario
- Plantillas personalizadas creadas por entrenadores
- Pueden originarse desde planes de entrenamiento existentes
- Pueden ser eliminadas por sus creadores
- Incluyen contador de uso

---

## Dependencias de Testing

El módulo de templates utiliza las siguientes dependencias para testing:

- `@nestjs/testing` - Framework de testing de NestJS
- `jest` - Framework de pruebas unitarias
- `@nestjs/mongoose` - Para mockear modelos de Mongoose
- `ts-jest` - Soporte de TypeScript para Jest

---

## Mocks Utilizados

### Modelos
- `Template Model`: Mockeado para simular operaciones CRUD en MongoDB
- `TrainingPlan Model`: Mockeado para simular relación con planes de entrenamiento

### Datos de Prueba
- Plantillas de usuario con sesiones y ejercicios
- Plantillas predefinidas del sistema
- Planes de entrenamiento de origen

---

## Notas Importantes

### Tipos de Plantilla
- **PREDEFINED**: Plantillas del sistema (no se pueden eliminar)
- **USER_CREATED**: Plantillas creadas por usuarios (pueden eliminarse)

### Soft Delete
Las plantillas no se eliminan físicamente de la base de datos, solo se marca `isActive: false`

### Relación con Planes
- Las plantillas pueden crearse desde planes existentes
- Al eliminar una plantilla, se desmarca el plan original como plantilla

### Categorías Predefinidas
- `FUERZA_BASICO`
- `HIPERTROFIA`
- `RESISTENCIA`
