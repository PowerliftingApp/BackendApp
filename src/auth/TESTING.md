# Pruebas Unitarias - Módulo de Autenticación

Este documento contiene la documentación de todas las pruebas unitarias implementadas para el módulo de autenticación del sistema Powerlift.

## Índice
- [AuthService](#authservice)
- [AuthController](#authcontroller)
- [JwtStrategy](#jwtstrategy)
- [Ejecutar las pruebas](#ejecutar-las-pruebas)

---

## AuthService

El `AuthService` es responsable de validar las credenciales de los usuarios y generar tokens JWT para la autenticación.

### Archivo de pruebas
`auth.service.spec.ts`

### Casos de Prueba

#### Validación del Servicio

| # | Nombre de la Prueba | Descripción | Resultado Esperado |
|---|---------------------|-------------|-------------------|
| 1 | `debe estar definido el servicio` | Verifica que el servicio AuthService se instancia correctamente | El servicio debe estar definido y no ser null |

#### Método `validateUser(email, password)`

| # | Nombre de la Prueba | Descripción | Resultado Esperado | Código de Prueba |
|---|---------------------|-------------|--------------------|------------------|
| 2 | `debe validar usuario con credenciales correctas` | Valida que un usuario con email y contraseña válidos es autenticado correctamente | Retorna el objeto del usuario completo | ```typescript<br>mockUsersService.findByEmail.mockResolvedValue(mockUser);<br>mockUser.comparePassword.mockResolvedValue(true);<br>const result = await service.validateUser('test@example.com', 'password123');<br>expect(result).toEqual(mockUser);<br>``` |
| 3 | `debe lanzar UnauthorizedException cuando el usuario no existe` | Verifica que se lanza una excepción cuando el email no existe en la base de datos | Lanza `UnauthorizedException` con mensaje "Credenciales inválidas" | ```typescript<br>mockUsersService.findByEmail.mockResolvedValue(null);<br>await expect(service.validateUser('noexiste@example.com', 'password123'))<br>  .rejects.toThrow(new UnauthorizedException('Credenciales inválidas'));<br>``` |
| 4 | `debe lanzar UnauthorizedException cuando el usuario no está activo` | Verifica que usuarios con estado PENDING no pueden iniciar sesión | Lanza `UnauthorizedException` con mensaje de activación de cuenta | ```typescript<br>const inactiveUser = { ...mockUser, status: UserStatus.PENDING };<br>mockUsersService.findByEmail.mockResolvedValue(inactiveUser);<br>await expect(service.validateUser('test@example.com', 'password123'))<br>  .rejects.toThrow(UnauthorizedException);<br>``` |
| 5 | `debe lanzar UnauthorizedException cuando la contraseña es incorrecta` | Verifica que contraseñas incorrectas son rechazadas | Lanza `UnauthorizedException` con mensaje "Credenciales inválidas" | ```typescript<br>mockUsersService.findByEmail.mockResolvedValue(mockUser);<br>mockUser.comparePassword.mockResolvedValue(false);<br>await expect(service.validateUser('test@example.com', 'wrongpassword'))<br>  .rejects.toThrow(new UnauthorizedException('Credenciales inválidas'));<br>``` |
| 6 | `debe manejar usuarios con estado INACTIVE` | Verifica que usuarios inactivos no pueden iniciar sesión | Lanza `UnauthorizedException` con mensaje de activación de cuenta | ```typescript<br>const inactiveUser = { ...mockUser, status: UserStatus.INACTIVE };<br>mockUsersService.findByEmail.mockResolvedValue(inactiveUser);<br>await expect(service.validateUser('test@example.com', 'password123'))<br>  .rejects.toThrow(UnauthorizedException);<br>``` |

#### Método `login(user)`

| # | Nombre de la Prueba | Descripción | Resultado Esperado | Código de Prueba |
|---|---------------------|-------------|--------------------|------------------|
| 7 | `debe generar token JWT y retornar datos del usuario` | Verifica que se genera correctamente un token JWT con los datos del usuario | Retorna objeto con `access_token` y datos del `user` | ```typescript<br>const mockToken = 'mock.jwt.token';<br>mockJwtService.sign.mockReturnValue(mockToken);<br>const result = await service.login(mockUser);<br>expect(result).toEqual({<br>  access_token: mockToken,<br>  user: { id, email, fullName, role, coachId }<br>});<br>``` |
| 8 | `debe generar token JWT para usuario atleta con coachId` | Verifica que los atletas reciben tokens con su coachId incluido | Token incluye el campo `coachId` del atleta | ```typescript<br>const athleteUser = { ...mockUser, role: 'athlete', coachId: '...' };<br>mockJwtService.sign.mockReturnValue(mockToken);<br>const result = await service.login(athleteUser);<br>expect(result.user.coachId).toBe(athleteUser.coachId);<br>``` |
| 9 | `debe incluir todos los campos requeridos en el payload del JWT` | Verifica que el payload del JWT contiene todos los campos necesarios | Payload contiene: `email`, `sub`, `role`, `coachId` | ```typescript<br>mockJwtService.sign.mockReturnValue('token');<br>await service.login(mockUser);<br>const payload = mockJwtService.sign.mock.calls[0][0];<br>expect(payload).toHaveProperty('email');<br>expect(payload).toHaveProperty('sub');<br>``` |

---

## AuthController

El `AuthController` maneja las peticiones HTTP relacionadas con la autenticación.

### Archivo de pruebas
`auth.controller.spec.ts`

### Casos de Prueba

#### Validación del Controlador

| # | Nombre de la Prueba | Descripción | Resultado Esperado |
|---|---------------------|-------------|-------------------|
| 10 | `debe estar definido el controlador` | Verifica que el controlador AuthController se instancia correctamente | El controlador debe estar definido y no ser null |

#### Endpoint `POST /auth/login`

| # | Nombre de la Prueba | Descripción | Resultado Esperado | Código de Prueba |
|---|---------------------|-------------|--------------------|------------------|
| 11 | `debe iniciar sesión exitosamente con credenciales válidas` | Verifica el flujo completo de login exitoso | Retorna token JWT y datos del usuario | ```typescript<br>const loginDto = { email: 'test@example.com', password: 'password123' };<br>mockAuthService.validateUser.mockResolvedValue(mockUser);<br>mockAuthService.login.mockResolvedValue(mockResponse);<br>const result = await controller.login(loginDto);<br>expect(result).toEqual(mockResponse);<br>``` |
| 12 | `debe lanzar UnauthorizedException con credenciales inválidas` | Verifica el manejo de errores cuando las credenciales son incorrectas | Lanza `UnauthorizedException` | ```typescript<br>mockAuthService.validateUser.mockRejectedValue(<br>  new UnauthorizedException('Credenciales inválidas')<br>);<br>await expect(controller.login(loginDto)).rejects.toThrow(UnauthorizedException);<br>``` |
| 13 | `debe lanzar UnauthorizedException cuando el usuario no está activo` | Verifica que usuarios inactivos no pueden loguearse | Lanza `UnauthorizedException` con mensaje específico | ```typescript<br>mockAuthService.validateUser.mockRejectedValue(<br>  new UnauthorizedException('Por favor, activa tu cuenta primero...')<br>);<br>await expect(controller.login(loginDto)).rejects.toThrow(UnauthorizedException);<br>``` |
| 14 | `debe manejar usuarios atletas correctamente` | Verifica que los atletas pueden loguearse y reciben su coachId | Token y respuesta incluyen el `coachId` | ```typescript<br>const athleteUser = { ...mockUser, role: 'athlete', coachId: '...' };<br>mockAuthService.validateUser.mockResolvedValue(athleteUser);<br>const result = await controller.login(loginDto);<br>expect(result.user.coachId).toBe(athleteUser.coachId);<br>``` |
| 15 | `debe propagar el mensaje de error correctamente` | Verifica que los mensajes de error se propagan correctamente | El mensaje de error original se mantiene | ```typescript<br>const errorMessage = 'Error específico de autenticación';<br>mockAuthService.validateUser.mockRejectedValue({ message: errorMessage });<br>await expect(controller.login(loginDto)).rejects.toThrow(<br>  new UnauthorizedException(errorMessage)<br>);<br>``` |
| 16 | `debe validar que el email se pasa correctamente` | Verifica que el email del DTO se pasa correctamente al servicio | El servicio recibe el email correcto | ```typescript<br>const customEmail = 'custom@example.com';<br>const customDto = { email: customEmail, password: 'pass123' };<br>await controller.login(customDto);<br>expect(authService.validateUser).toHaveBeenCalledWith(customEmail, 'pass123');<br>``` |

---

## JwtStrategy

La `JwtStrategy` valida los tokens JWT y extrae la información del usuario para las peticiones autenticadas.

### Archivo de pruebas
`jwt.strategy.spec.ts`

### Casos de Prueba

#### Validación de la Estrategia

| # | Nombre de la Prueba | Descripción | Resultado Esperado |
|---|---------------------|-------------|-------------------|
| 17 | `debe estar definida la estrategia JWT` | Verifica que la estrategia JWT se instancia correctamente | La estrategia debe estar definida y no ser null |

#### Método `validate(payload)`

| # | Nombre de la Prueba | Descripción | Resultado Esperado | Código de Prueba |
|---|---------------------|-------------|--------------------|------------------|
| 18 | `debe validar y retornar datos del usuario con token válido` | Valida tokens JWT correctos y retorna los datos del usuario | Retorna objeto con `userId`, `email`, `role`, `coachId` | ```typescript<br>const mockPayload = { email: '...', sub: '...', role: '...', coachId: null };<br>mockUsersService.findByEmail.mockResolvedValue(mockUser);<br>const result = await strategy.validate(mockPayload);<br>expect(result).toEqual({ userId, email, role, coachId });<br>``` |
| 19 | `debe lanzar UnauthorizedException si el usuario no existe` | Verifica el rechazo de tokens de usuarios inexistentes | Lanza `UnauthorizedException` con mensaje "Cuenta no activada o inválida" | ```typescript<br>mockUsersService.findByEmail.mockResolvedValue(null);<br>await expect(strategy.validate(mockPayload)).rejects.toThrow(<br>  new UnauthorizedException('Cuenta no activada o inválida')<br>);<br>``` |
| 20 | `debe lanzar UnauthorizedException si el usuario no está activo` | Verifica el rechazo de tokens de usuarios con estado PENDING | Lanza `UnauthorizedException` | ```typescript<br>const inactiveUser = { ...mockUser, status: UserStatus.PENDING };<br>mockUsersService.findByEmail.mockResolvedValue(inactiveUser);<br>await expect(strategy.validate(mockPayload)).rejects.toThrow(UnauthorizedException);<br>``` |
| 21 | `debe manejar usuarios con estado INACTIVE` | Verifica el rechazo de usuarios inactivos | Lanza `UnauthorizedException` | ```typescript<br>const inactiveUser = { ...mockUser, status: UserStatus.INACTIVE };<br>mockUsersService.findByEmail.mockResolvedValue(inactiveUser);<br>await expect(strategy.validate(mockPayload)).rejects.toThrow(UnauthorizedException);<br>``` |
| 22 | `debe validar correctamente un usuario atleta` | Verifica la validación de tokens de usuarios atletas con coachId | Retorna objeto con el `coachId` del atleta | ```typescript<br>const athleteUser = { ...mockUser, role: 'athlete', coachId: '...' };<br>const athletePayload = { email, sub, role: 'athlete', coachId };<br>mockUsersService.findByEmail.mockResolvedValue(athleteUser);<br>const result = await strategy.validate(athletePayload);<br>expect(result.coachId).toBe(athleteUser.coachId);<br>``` |
| 23 | `debe extraer correctamente el userId del campo sub` | Verifica que el userId se mapea correctamente desde el campo `sub` del payload | `result.userId` es igual a `payload.sub` | ```typescript<br>mockUsersService.findByEmail.mockResolvedValue(mockUser);<br>const result = await strategy.validate(mockPayload);<br>expect(result.userId).toBe(mockPayload.sub);<br>``` |
| 24 | `debe retornar todos los campos esperados en el resultado` | Verifica que el resultado contiene todos los campos necesarios | Objeto tiene propiedades: `userId`, `email`, `role`, `coachId` | ```typescript<br>mockUsersService.findByEmail.mockResolvedValue(mockUser);<br>const result = await strategy.validate(mockPayload);<br>expect(result).toHaveProperty('userId');<br>expect(result).toHaveProperty('email');<br>``` |

---

## Ejecutar las Pruebas

### Ejecutar todas las pruebas del módulo de autenticación
```bash
npm test -- auth
```

### Ejecutar pruebas de un archivo específico
```bash
# AuthService
npm test -- auth.service.spec.ts

# AuthController
npm test -- auth.controller.spec.ts

# JwtStrategy
npm test -- jwt.strategy.spec.ts
```

### Ejecutar con cobertura de código
```bash
npm test -- auth --coverage
```

### Modo watch (desarrollo)
```bash
npm test -- auth --watch
```

---

## Resumen de Cobertura

El módulo de autenticación cuenta con **24 pruebas unitarias** que cubren:

| Componente | Pruebas | Funcionalidades Cubiertas |
|------------|---------|---------------------------|
| **AuthService** | 9 | Validación de usuarios, generación de tokens JWT, manejo de estados de cuenta |
| **AuthController** | 7 | Endpoint de login, manejo de errores HTTP, validación de DTOs |
| **JwtStrategy** | 8 | Validación de tokens JWT, extracción de payload, verificación de usuarios activos |
| **TOTAL** | **24** | **Cobertura completa de funcionalidades esenciales** |

---

## Dependencias de Testing

El módulo de autenticación utiliza las siguientes dependencias para testing:

- `@nestjs/testing` - Framework de testing de NestJS
- `jest` - Framework de pruebas unitarias
- `ts-jest` - Soporte de TypeScript para Jest

---

## Notas Importantes

### Mocks Utilizados
- `UsersService`: Mockeado para simular búsqueda de usuarios
- `JwtService`: Mockeado para simular generación de tokens
- `ConfigService`: Mockeado para simular configuración del sistema

### Estados de Usuario Probados
- `ACTIVE`: Usuario activo que puede autenticarse ✅
- `PENDING`: Usuario pendiente de activación ❌
- `INACTIVE`: Usuario desactivado ❌

### Roles de Usuario Probados
- `coach`: Entrenador sin coachId
- `athlete`: Atleta con coachId asignado
