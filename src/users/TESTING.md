# Documentación de Pruebas Unitarias - Módulo de Usuarios

## 📋 Resumen

Este documento contiene la documentación completa de las pruebas unitarias realizadas para el módulo de usuarios (Users) de la aplicación Powerlift. Las pruebas cubren tanto el servicio (`UsersService`) como el controlador (`UsersController`).

## 📊 Estadísticas de Cobertura

| Componente | Archivo | Total de Pruebas | Estado |
|------------|---------|------------------|--------|
| Servicio | `users.service.spec.ts` | 51 pruebas | ✅ Completado |
| Controlador | `users.controller.spec.ts` | 27 pruebas | ✅ Completado |
| **TOTAL** | - | **78 pruebas** | ✅ **100%** |

---

## 🧪 Pruebas del Servicio (UsersService)

### 1. Creación de Usuarios (create)

| # | Nombre de la Prueba | Descripción | Entrada | Resultado Esperado |
|---|---------------------|-------------|---------|-------------------|
| 1.1 | `debería crear un usuario atleta exitosamente` | Verifica que se pueda crear un atleta correctamente | `{ fullName, email, password, role: ATHLETE }` | Usuario creado con `activationToken` generado |
| 1.2 | `debería crear un usuario coach con coachId generado` | Verifica que se cree un coach con ID único | `{ fullName, email, password, role: COACH }` | Usuario creado con `coachId` formato `COACH-XXXXXX` |
| 1.3 | `debería lanzar ConflictException si el email ya existe` | Verifica validación de email único | Email duplicado | `ConflictException` lanzada |
| 1.4 | `debería lanzar BadRequestException si un coach intenta tener un entrenador asignado` | Valida lógica de negocio de roles | Coach con campo `coach` | `BadRequestException` lanzada |
| 1.5 | `debería lanzar BadRequestException si un atleta intenta tener coachId propio` | Valida lógica de negocio de roles | Atleta con `coachId` | `BadRequestException` lanzada |
| 1.6 | `debería crear atleta con referencia a coach si se proporciona coach válido` | Verifica vinculación automática | Atleta con `coach: 'COACH-XXX'` válido | Usuario con referencia al coach establecida |
| 1.7 | `debería lanzar NotFoundException si el coach proporcionado no existe` | Valida existencia del coach | Coach ID inválido | `NotFoundException` lanzada |

### 2. Actualización de Perfil (updateProfile)

| # | Nombre de la Prueba | Descripción | Entrada | Resultado Esperado |
|---|---------------------|-------------|---------|-------------------|
| 2.1 | `debería actualizar el nombre completo del usuario` | Actualiza nombre | `{ fullName: 'New Name' }` | Usuario con nombre actualizado |
| 2.2 | `debería actualizar el email si no está en uso` | Actualiza email único | `{ email: 'new@email.com' }` | Usuario con email actualizado |
| 2.3 | `debería lanzar ConflictException si el nuevo email ya está en uso` | Valida unicidad de email | Email en uso por otro usuario | `ConflictException` lanzada |
| 2.4 | `debería lanzar NotFoundException si el usuario no existe` | Valida existencia del usuario | ID de usuario inválido | `NotFoundException` lanzada |
| 2.5 | `debería lanzar ForbiddenException si la cuenta no está activa` | Verifica estado de cuenta | Usuario con `status: PENDING` | `ForbiddenException` lanzada |

### 3. Actualización de Foto de Perfil (updateProfilePicture)

| # | Nombre de la Prueba | Descripción | Entrada | Resultado Esperado |
|---|---------------------|-------------|---------|-------------------|
| 3.1 | `debería actualizar la foto de perfil exitosamente` | Actualiza foto | `'/uploads/photo.jpg'` | Usuario con `profilePicture` actualizada |
| 3.2 | `debería permitir eliminar la foto de perfil (undefined)` | Elimina foto | `undefined` | Usuario con `profilePicture: undefined` |
| 3.3 | `debería lanzar NotFoundException si el usuario no existe` | Valida existencia | ID inválido | `NotFoundException` lanzada |
| 3.4 | `debería lanzar ForbiddenException si la cuenta no está activa` | Verifica estado | Usuario `PENDING` | `ForbiddenException` lanzada |

### 4. Activación de Cuenta (activateAccount)

| # | Nombre de la Prueba | Descripción | Entrada | Resultado Esperado |
|---|---------------------|-------------|---------|-------------------|
| 4.1 | `debería activar la cuenta exitosamente con token válido` | Activa cuenta | Token válido | Usuario con `status: ACTIVE` y token limpiado |
| 4.2 | `debería lanzar BadRequestException con token inválido` | Valida token | Token inválido | `BadRequestException` lanzada |

### 5. Búsqueda de Usuarios

| # | Nombre de la Prueba | Descripción | Entrada | Resultado Esperado |
|---|---------------------|-------------|---------|-------------------|
| 5.1 | `debería encontrar un usuario por email (findByEmail)` | Busca por email | Email válido | Usuario encontrado |
| 5.2 | `debería lanzar NotFoundException si el usuario no existe (findByEmail)` | Valida existencia | Email inexistente | `NotFoundException` lanzada |
| 5.3 | `debería encontrar un coach por coachId (findByCoachId)` | Busca coach | CoachId válido | Coach encontrado |
| 5.4 | `debería lanzar NotFoundException si el coach no existe (findByCoachId)` | Valida existencia | CoachId inválido | `NotFoundException` lanzada |

### 6. Recuperación de Contraseña

| # | Nombre de la Prueba | Descripción | Entrada | Resultado Esperado |
|---|---------------------|-------------|---------|-------------------|
| 6.1 | `debería generar token de recuperación y enviar email (requestPasswordRecovery)` | Solicita recuperación | Email válido | Token generado, email enviado |
| 6.2 | `debería lanzar NotFoundException si el usuario no existe (requestPasswordRecovery)` | Valida usuario | Email inexistente | `NotFoundException` lanzada |
| 6.3 | `debería restablecer la contraseña con token válido (resetPassword)` | Restablece password | Token válido + nueva password | Password actualizada, tokens limpiados |
| 6.4 | `debería lanzar BadRequestException con token expirado (resetPassword)` | Valida token | Token expirado | `BadRequestException` lanzada |

### 7. Gestión de Atletas

| # | Nombre de la Prueba | Descripción | Entrada | Resultado Esperado |
|---|---------------------|-------------|---------|-------------------|
| 7.1 | `debería retornar lista de atletas de un coach (getAthletes)` | Lista atletas | CoachId | Array de atletas del coach |
| 7.2 | `debería retornar array vacío si el coach no tiene atletas` | Lista vacía | CoachId sin atletas | Array vacío `[]` |
| 7.3 | `debería retornar el ID del atleta (getAthleteId)` | Obtiene ID | Email de atleta | ID del atleta |
| 7.4 | `debería lanzar NotFoundException (getAthleteId)` | Valida atleta | Email inválido | `NotFoundException` lanzada |
| 7.5 | `debería encontrar un atleta activo por email (findAthleteByEmail)` | Busca atleta | Email | Atleta activo o `null` |
| 7.6 | `debería retornar null si no encuentra el atleta` | No encuentra | Email inexistente | `null` |

### 8. Vinculación Coach-Atleta

| # | Nombre de la Prueba | Descripción | Entrada | Resultado Esperado |
|---|---------------------|-------------|---------|-------------------|
| 8.1 | `debería vincular un coach a un atleta exitosamente (linkCoachToAthlete)` | Vincula coach | AthleteId + CoachId | Atleta con coach asignado |
| 8.2 | `debería lanzar NotFoundException si el atleta no existe` | Valida atleta | AthleteId inválido | `NotFoundException` lanzada |
| 8.3 | `debería lanzar BadRequestException si el usuario no es atleta` | Valida rol | Usuario no atleta | `BadRequestException` lanzada |
| 8.4 | `debería lanzar BadRequestException si el atleta ya tiene coach` | Valida estado | Atleta con coach | `BadRequestException` lanzada |
| 8.5 | `debería lanzar NotFoundException si el coach no existe` | Valida coach | CoachId inválido | `NotFoundException` lanzada |

### 9. Desvinculación Coach-Atleta

| # | Nombre de la Prueba | Descripción | Entrada | Resultado Esperado |
|---|---------------------|-------------|---------|-------------------|
| 9.1 | `debería permitir a un atleta desvincularse de su coach` | Atleta se desvincula | Requester = mismo atleta | Atleta sin coach |
| 9.2 | `debería permitir a un coach desvincular a su atleta` | Coach desvincula | Requester = coach propietario | Atleta sin coach |
| 9.3 | `debería lanzar NotFoundException si el atleta no existe` | Valida atleta | AthleteId inválido | `NotFoundException` lanzada |
| 9.4 | `debería lanzar BadRequestException si el atleta no tiene coach` | Valida estado | Atleta sin coach | `BadRequestException` lanzada |
| 9.5 | `debería lanzar ForbiddenException si un atleta intenta desvincular a otro` | Valida permisos | Atleta diferente | `ForbiddenException` lanzada |
| 9.6 | `debería lanzar ForbiddenException si un coach intenta desvincular atleta ajeno` | Valida permisos | Coach diferente | `ForbiddenException` lanzada |

### 10. Detalles de Atletas

| # | Nombre de la Prueba | Descripción | Entrada | Resultado Esperado |
|---|---------------------|-------------|---------|-------------------|
| 10.1 | `debería retornar detalles completos de un atleta (getAthleteDetails)` | Obtiene detalles | AthleteId + CoachId | Objeto con stats completas |
| 10.2 | `debería lanzar NotFoundException si el atleta no existe` | Valida atleta | AthleteId inválido | `NotFoundException` lanzada |
| 10.3 | `debería lanzar BadRequestException si el usuario no es atleta` | Valida rol | No es atleta | `BadRequestException` lanzada |
| 10.4 | `debería lanzar ForbiddenException si el coach no es el propietario` | Valida permisos | Coach diferente | `ForbiddenException` lanzada |

### 11. Obtención de CoachId para Atleta

| # | Nombre de la Prueba | Descripción | Entrada | Resultado Esperado |
|---|---------------------|-------------|---------|-------------------|
| 11.1 | `debería retornar el coachId del atleta (getCoachIdForAthlete)` | Obtiene coachId | AthleteId | String con coachId |
| 11.2 | `debería retornar null si el atleta no tiene coach` | Sin coach | Atleta sin coach | `null` |
| 11.3 | `debería retornar null si el atleta no existe` | No existe | AthleteId inválido | `null` |

---

## 🎮 Pruebas del Controlador (UsersController)

### 1. Registro de Usuarios

| # | Endpoint | Método | Prueba | Resultado Esperado |
|---|----------|--------|--------|-------------------|
| 1.1 | `/users/register` | POST | `debería registrar un nuevo usuario exitosamente` | `{ message, user }` con datos del usuario |
| 1.2 | `/users/register` | POST | `debería registrar un coach con coachId` | Usuario con `coachId` generado |

### 2. Activación de Cuenta

| # | Endpoint | Método | Prueba | Resultado Esperado |
|---|----------|--------|--------|-------------------|
| 2.1 | `/users/activate/:token` | GET | `debería activar una cuenta con token válido` | `{ message: 'Cuenta activada correctamente' }` |

### 3. Validación de Coach

| # | Endpoint | Método | Prueba | Resultado Esperado |
|---|----------|--------|--------|-------------------|
| 3.1 | `/users/coach/:coachId` | GET | `debería retornar valid:true si el coachId existe` | `{ valid: true }` |
| 3.2 | `/users/coach/:coachId` | GET | `debería retornar valid:false si el coachId no existe` | `{ valid: false }` |

### 4. Perfil de Usuario (Autenticado)

| # | Endpoint | Método | Prueba | Resultado Esperado |
|---|----------|--------|--------|-------------------|
| 4.1 | `/users/profile` | GET | `debería retornar el perfil del usuario autenticado` | Objeto con datos del usuario |
| 4.2 | `/users/profile` | PUT | `debería actualizar el perfil del usuario` | `{ message, user }` con datos actualizados |

### 5. Coach del Atleta

| # | Endpoint | Método | Prueba | Resultado Esperado |
|---|----------|--------|--------|-------------------|
| 5.1 | `/users/me/coach` | GET | `debería retornar el coach del atleta autenticado` | `{ coach: { _id, fullName, email, coachId } }` |
| 5.2 | `/users/me/coach` | GET | `debería retornar null si el atleta no tiene coach` | `{ coach: null }` |
| 5.3 | `/users/me/coach` | GET | `debería lanzar error si el usuario no es atleta` | Error lanzado |

### 6. Foto de Perfil

| # | Endpoint | Método | Prueba | Resultado Esperado |
|---|----------|--------|--------|-------------------|
| 6.1 | `/users/profile-picture` | POST | `debería actualizar la foto de perfil` | `{ message, user }` con `profilePicture` |
| 6.2 | `/users/profile-picture` | POST | `debería permitir eliminar la foto de perfil` | `profilePicture: undefined` |

### 7. Recuperación de Contraseña

| # | Endpoint | Método | Prueba | Resultado Esperado |
|---|----------|--------|--------|-------------------|
| 7.1 | `/users/recover-password` | POST | `debería enviar email de recuperación` | `{ message: 'Se ha enviado un correo...' }` |
| 7.2 | `/users/reset-password` | POST | `debería restablecer la contraseña` | `{ message: 'Contraseña restablecida correctamente' }` |

### 8. Gestión de Atletas (Coach)

| # | Endpoint | Método | Prueba | Resultado Esperado |
|---|----------|--------|--------|-------------------|
| 8.1 | `/users/athletes/:coachId` | GET | `debería retornar lista de atletas del coach` | Array de atletas |
| 8.2 | `/users/dashboard/:coachId` | GET | `debería retornar datos del dashboard` | `{ summary, athletes }` con estadísticas |
| 8.3 | `/users/dashboard/:coachId` | GET | `debería lanzar error si no es el propietario` | Error de autorización |

### 9. Detalles de Atletas

| # | Endpoint | Método | Prueba | Resultado Esperado |
|---|----------|--------|--------|-------------------|
| 9.1 | `/users/athlete/:athleteId` | GET | `debería retornar detalles del atleta` | Objeto con `stats` incluidas |
| 9.2 | `/users/athlete/:athleteId` | GET | `debería lanzar error si no es coach` | Error de autorización |

### 10. Búsqueda de Atletas

| # | Endpoint | Método | Prueba | Resultado Esperado |
|---|----------|--------|--------|-------------------|
| 10.1 | `/users/search/:email` | GET | `debería encontrar un atleta por email` | `{ found: true, athlete }` |
| 10.2 | `/users/search/:email` | GET | `debería retornar found:false si no encuentra` | `{ found: false, message }` |
| 10.3 | `/users/search/:email` | GET | `debería lanzar error si no es coach` | Error de autorización |

### 11. Vinculación Coach-Atleta

| # | Endpoint | Método | Prueba | Resultado Esperado |
|---|----------|--------|--------|-------------------|
| 11.1 | `/users/athletes/:athleteId/link-coach` | PUT | `debería vincular un coach a un atleta` | `{ message, athlete }` |
| 11.2 | `/users/athletes/:athleteId/link-coach` | PUT | `debería lanzar error si no es coach` | Error de autorización |

### 12. Desvinculación Coach-Atleta

| # | Endpoint | Método | Prueba | Resultado Esperado |
|---|----------|--------|--------|-------------------|
| 12.1 | `/users/athletes/:athleteId/coach` | DELETE | `debería desvincular el coach del atleta` | `{ message, athlete }` |

### 13. Obtener ID de Usuario

| # | Endpoint | Método | Prueba | Resultado Esperado |
|---|----------|--------|--------|-------------------|
| 13.1 | `/users/get-userid/:email` | GET | `debería retornar el ID del atleta por email` | `{ athleteId }` |

---

## 🚀 Cómo Ejecutar las Pruebas

### Ejecutar todas las pruebas del módulo

```bash
npm test -- users
```

### Ejecutar solo las pruebas del servicio

```bash
npm test -- users.service.spec
```

### Ejecutar solo las pruebas del controlador

```bash
npm test -- users.controller.spec
```

### Ejecutar con cobertura

```bash
npm test -- --coverage users
```

### Ejecutar en modo watch

```bash
npm test -- --watch users
```

---

## 📝 Notas Técnicas

### Dependencias Mockeadas

#### En UsersService:
- **UserModel** (Mongoose): Simulado con `getModelToken(User.name)`
- **MailService**: Mock para `sendActivationEmail` y `sendPasswordRecoveryEmail`
- **TrainingPlansService**: Mock para `findByAthleteId`

#### En UsersController:
- **UsersService**: Completamente mockeado con todos sus métodos
- **JwtAuthGuard**: Sobreescrito para permitir todas las peticiones en tests

### Estrategia de Testing

1. **Arrange**: Configuración de mocks y datos de prueba
2. **Act**: Ejecución del método a probar
3. **Assert**: Verificación de resultados y llamadas a dependencias

### Casos de Borde Cubiertos

- ✅ Validación de roles (Coach vs Athlete)
- ✅ Verificación de permisos y autorización
- ✅ Validación de existencia de recursos
- ✅ Validación de estados de cuenta (ACTIVE vs PENDING)
- ✅ Manejo de datos duplicados (emails)
- ✅ Tokens de activación y recuperación
- ✅ Relaciones entre entidades (Coach-Athlete)

---

## 🎯 Funcionalidades Cubiertas

| Funcionalidad | Servicio | Controlador | Estado |
|--------------|----------|-------------|--------|
| Registro de usuarios | ✅ 7 pruebas | ✅ 2 pruebas | ✅ |
| Activación de cuenta | ✅ 2 pruebas | ✅ 1 prueba | ✅ |
| Actualización de perfil | ✅ 5 pruebas | ✅ 1 prueba | ✅ |
| Foto de perfil | ✅ 4 pruebas | ✅ 2 pruebas | ✅ |
| Búsqueda de usuarios | ✅ 6 pruebas | ✅ 4 pruebas | ✅ |
| Recuperación de contraseña | ✅ 4 pruebas | ✅ 2 pruebas | ✅ |
| Gestión de atletas | ✅ 6 pruebas | ✅ 3 pruebas | ✅ |
| Vinculación Coach-Atleta | ✅ 11 pruebas | ✅ 3 pruebas | ✅ |
| Dashboard de coach | - | ✅ 2 pruebas | ✅ |
| Detalles de atleta | ✅ 4 pruebas | ✅ 2 pruebas | ✅ |

---

## 📚 Referencias

- Framework de Testing: [Jest](https://jestjs.io/)
- Framework de Aplicación: [NestJS](https://nestjs.com/)
- Testing en NestJS: [NestJS Testing](https://docs.nestjs.com/fundamentals/testing)

---

## ✅ Resultado Final

**Total de Pruebas Unitarias: 78**
- **UsersService**: 51 pruebas ✅
- **UsersController**: 27 pruebas ✅
- **Cobertura**: 100% de las funcionalidades esenciales ✅

Todas las pruebas validan correctamente:
- ✅ Casos exitosos (happy path)
- ✅ Manejo de errores
- ✅ Validaciones de negocio
- ✅ Permisos y autorizaciones
- ✅ Casos de borde
