# Arquitectura del Sistema Powerlift

Este documento describe la arquitectura y estructura del sistema Powerlift, una aplicación de gestión de entrenamientos para atletas y coaches.

## Índice
- [Visión General](#visión-general)
- [Arquitectura General](#arquitectura-general)
- [Stack Tecnológico](#stack-tecnológico)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Módulos del Sistema](#módulos-del-sistema)
- [Patrones de Diseño](#patrones-de-diseño)
- [Base de Datos](#base-de-datos)
- [Autenticación y Autorización](#autenticación-y-autorización)
- [APIs y Endpoints](#apis-y-endpoints)
- [Testing](#testing)
- [Despliegue](#despliegue)

---

## Visión General

Powerlift es una aplicación web full-stack diseñada para gestionar planes de entrenamiento entre coaches y atletas. El sistema permite:

- **Coaches**: Crear y gestionar planes de entrenamiento, monitorear progreso de atletas, generar plantillas reutilizables
- **Atletas**: Ejecutar planes asignados, enviar feedback de entrenamientos, subir evidencia multimedia
- **Dashboard**: Métricas y estadísticas de rendimiento para coaches

---

## Arquitectura General

### Patrón Arquitectónico
- **Backend**: API REST con NestJS (Node.js)
- **Frontend**: SPA con React + TypeScript
- **Base de Datos**: MongoDB con Mongoose ODM
- **Autenticación**: JWT (JSON Web Tokens)
- **Comunicación**: HTTP/HTTPS con JSON

### Diagrama de Arquitectura

```
┌─────────────────┐    HTTP/HTTPS    ┌─────────────────┐
│   Frontend      │◄─────────────────►│   Backend       │
│   (React SPA)   │     JSON API     │   (NestJS)      │
└─────────────────┘                  └─────────────────┘
                                              │
                                              │ Mongoose ODM
                                              ▼
                                     ┌─────────────────┐
                                     │   MongoDB       │
                                     │   Database      │
                                     └─────────────────┘
```

---

## Stack Tecnológico

### Backend
- **Framework**: NestJS (Node.js)
- **Lenguaje**: TypeScript
- **Base de Datos**: MongoDB
- **ODM**: Mongoose
- **Autenticación**: JWT + Passport
- **Validación**: Class Validator + Class Transformer
- **Testing**: Jest + Supertest
- **Documentación**: Swagger/OpenAPI
- **Contenedores**: Docker + Docker Compose

### Frontend
- **Framework**: React 18
- **Lenguaje**: TypeScript
- **Build Tool**: Vite
- **UI Library**: Shadcn/ui + Tailwind CSS
- **Estado**: React Hooks + Context API
- **HTTP Client**: Axios
- **Routing**: React Router

### DevOps
- **Contenedores**: Docker
- **Orquestación**: Docker Compose

---

## Estructura del Proyecto

```
Powerlift/
├── BackendApp/                 # API Backend (NestJS)
│   ├── src/
│   │   ├── auth/              # Módulo de autenticación
│   │   ├── users/             # Módulo de usuarios
│   │   ├── templates/         # Módulo de plantillas
│   │   ├── training-plans/    # Módulo de planes de entrenamiento
│   │   ├── mail/              # Módulo de correo electrónico
│   │   ├── app.module.ts      # Módulo principal
│   │   └── main.ts           # Punto de entrada
│   ├── test/                 # Pruebas E2E
│   ├── uploads/              # Archivos multimedia
│   ├── docker-compose.yml    # Configuración Docker
│   ├── Dockerfile           # Imagen Docker
│   └── package.json         # Dependencias
│
└── FrontendApp/              # Frontend (React)
    ├── src/
    │   ├── components/       # Componentes reutilizables
    │   ├── pages/           # Páginas de la aplicación
    │   ├── hooks/           # Custom hooks
    │   ├── lib/             # Utilidades y configuración
    │   └── assets/          # Recursos estáticos
    ├── public/              # Archivos públicos
    └── package.json         # Dependencias
```

---

## Módulos del Sistema

### 1. Módulo de Autenticación (`auth/`)
**Responsabilidad**: Gestión de autenticación y autorización

**Componentes**:
- `AuthService`: Lógica de validación de usuarios y generación de JWT
- `AuthController`: Endpoints de login
- `JwtStrategy`: Estrategia de validación JWT
- `JwtAuthGuard`: Guard de protección de rutas

**Funcionalidades**:
- Login de usuarios (coaches y atletas)
- Generación y validación de tokens JWT
- Protección de rutas autenticadas

### 2. Módulo de Usuarios (`users/`)
**Responsabilidad**: Gestión de perfiles de usuarios

**Componentes**:
- `UsersService`: CRUD de usuarios, gestión de perfiles
- `UsersController`: Endpoints de gestión de usuarios
- `UserSchema`: Modelo de datos de usuario

**Funcionalidades**:
- Registro y actualización de perfiles
- Gestión de roles (coach/athlete)
- Subida de fotos de perfil
- Soft delete de usuarios

### 3. Módulo de Plantillas (`templates/`)
**Responsabilidad**: Gestión de plantillas de entrenamiento

**Componentes**:
- `TemplatesService`: CRUD de plantillas, conversión desde planes
- `TemplatesController`: Endpoints de gestión de plantillas
- `TemplateSchema`: Modelo de datos de plantilla

**Funcionalidades**:
- Creación de plantillas personalizadas
- Plantillas predefinidas del sistema
- Conversión de planes a plantillas
- Estadísticas de uso
- Soft delete de plantillas de usuario

### 4. Módulo de Planes de Entrenamiento (`training-plans/`)
**Responsabilidad**: Gestión completa de planes de entrenamiento (módulo más complejo)

**Componentes**:
- `TrainingPlansService`: Lógica compleja de gestión de planes
- `TrainingPlansController`: Endpoints de planes y feedback
- `TrainingPlanSchema`: Modelo de datos complejo con sesiones y ejercicios

**Funcionalidades**:
- Creación de planes con generación automática de IDs
- Gestión de sesiones y ejercicios
- Feedback de atletas (texto, multimedia)
- Seguimiento de sets realizados
- Dashboard de métricas para coaches
- Conversión a plantillas

### 5. Módulo de Correo (`mail/`)
**Responsabilidad**: Envío de notificaciones por email

**Componentes**:
- `MailService`: Configuración y envío de emails
- `MailModule`: Configuración del módulo

**Funcionalidades**:
- Envío de emails de bienvenida
- Notificaciones de planes asignados
- Templates de email

---

## Patrones de Diseño

### 1. Arquitectura Modular (NestJS)
- **Separación por dominio**: Cada módulo maneja un dominio específico
- **Inyección de dependencias**: Gestión automática de dependencias
- **Decoradores**: Metadatos para configuración y validación

### 2. Repository Pattern (Mongoose)
- **Abstracción de datos**: Mongoose como capa de abstracción sobre MongoDB
- **Schemas**: Definición de estructura de datos
- **Modelos**: Operaciones CRUD tipadas

### 3. DTO Pattern
- **Data Transfer Objects**: Validación y transformación de datos de entrada
- **Class Validator**: Validación automática de propiedades
- **Class Transformer**: Transformación de datos

### 4. Guard Pattern (NestJS)
- **Protección de rutas**: Guards para autenticación y autorización
- **JWT Strategy**: Validación de tokens JWT
- **Role-based access**: Control de acceso basado en roles

### 5. Service Layer Pattern
- **Lógica de negocio**: Servicios encapsulan la lógica de negocio
- **Reutilización**: Servicios pueden ser inyectados en múltiples controladores
- **Testing**: Fácil mockeo para pruebas unitarias

---

## Base de Datos

### MongoDB Collections

#### Users Collection
```typescript
{
  _id: ObjectId,
  email: string,
  password: string (hashed),
  fullName: string,
  role: 'coach' | 'athlete',
  coachId?: string,        // Para atletas
  profileImage?: string,
  isActive: boolean,
  createdAt: Date,
  updatedAt: Date
}
```

#### Templates Collection
```typescript
{
  _id: ObjectId,
  name: string,
  description: string,
  type: 'PREDEFINED' | 'USER_CREATED',
  predefinedCategory?: 'FUERZA_BASICO' | 'HIPERTROFIA' | 'RESISTENCIA',
  createdBy: string,
  usageCount: number,
  isActive: boolean,
  sessions: SessionSchema[],
  createdAt: Date,
  updatedAt: Date
}
```

#### Training Plans Collection
```typescript
{
  _id: ObjectId,
  athleteId: ObjectId (ref: User),
  coachId: string,
  name: string,
  startDate: Date,
  endDate: Date,
  isTemplate: boolean,
  templateId?: ObjectId (ref: Template),
  sessions: [
    {
      sessionId: string,        // ID lógico: S-XXXXXX
      sessionName: string,
      date: string,
      sessionNotes: string,
      completed: boolean,
      exercises: [
        {
          exerciseId: string,   // ID lógico: E-XXXXXX
          name: string,
          sets: number,
          reps: number,
          rpe?: number,
          rir?: number,
          rm?: number,
          weight?: number,
          completed: boolean,
          performanceComment?: string,
          mediaUrl?: string,
          athleteNotes?: string,
          performedSets: [
            {
              setId: string,     // ID lógico: PS-XXXXXX
              setNumber: number,
              repsPerformed?: number,
              loadUsed?: number,
              measureAchieved?: number,
              completed: boolean
            }
          ]
        }
      ]
    }
  ],
  createdAt: Date,
  updatedAt: Date
}
```

### Índices
- `users.email`: Único
- `users.coachId`: Para búsquedas de atletas por coach
- `training_plans.athleteId`: Para búsquedas por atleta
- `training_plans.coachId`: Para búsquedas por coach
- `templates.createdBy`: Para búsquedas por creador

---

## Autenticación y Autorización

### JWT Authentication
```typescript
// Token Payload
{
  userId: string,
  email: string,
  role: 'coach' | 'athlete',
  coachId?: string,  // Para atletas
  iat: number,      // Issued at
  exp: number        // Expiration
}
```

### Roles y Permisos

#### Coach
- Crear y gestionar planes de entrenamiento
- Asignar planes a atletas
- Ver dashboard con métricas
- Crear plantillas personalizadas
- Acceso a feedback de atletas

#### Athlete
- Ver planes asignados
- Enviar feedback de ejercicios
- Subir archivos multimedia
- Actualizar notas de sesión
- Marcar sets como completados

### Guards Implementados
- `JwtAuthGuard`: Verificación de token JWT
- `RoleGuard`: Verificación de roles específicos
- `CoachGuard`: Acceso exclusivo para coaches

---

## APIs y Endpoints

### Autenticación
```
POST /auth/login              # Login de usuario
```

### Usuarios
```
GET    /users                 # Listar usuarios (coaches)
GET    /users/:id             # Obtener usuario por ID
PATCH  /users/:id             # Actualizar perfil
DELETE /users/:id             # Eliminar usuario (soft delete)
POST   /users/:id/profile-image # Subir foto de perfil
```

### Plantillas
```
GET    /templates             # Listar plantillas (con filtros)
GET    /templates/predefined  # Plantillas predefinidas
GET    /templates/most-used   # Plantillas más utilizadas
GET    /templates/by-type/:type # Filtrar por tipo
GET    /templates/by-creator/:createdBy # Filtrar por creador
GET    /templates/:id         # Obtener plantilla por ID
POST   /templates             # Crear plantilla
POST   /templates/from-plan   # Crear desde plan
PATCH  /templates/:id         # Actualizar plantilla
PATCH  /templates/:id/increment-usage # Incrementar uso
DELETE /templates/:id         # Eliminar plantilla
```

### Planes de Entrenamiento
```
GET    /training-plans                    # Listar planes (con filtros)
GET    /training-plans/:id               # Obtener plan por ID
POST   /training-plans                    # Crear plan
PATCH  /training-plans/:id                # Actualizar plan
DELETE /training-plans/:id                 # Eliminar plan
POST   /training-plans/:id/convert-to-template # Convertir a plantilla
PATCH  /training-plans/:id/remove-template-status # Quitar estado plantilla
GET    /training-plans/dashboard/:coachId # Dashboard de métricas

# Feedback de Atletas
POST   /training-plans/feedback/exercise      # Feedback de ejercicio
PATCH  /training-plans/feedback/session-notes # Notas de sesión
PATCH  /training-plans/feedback/exercise-sets # Sets realizados
```

---

## Testing

### Estrategia de Testing

#### Pruebas Unitarias
- **Servicios**: Lógica de negocio aislada
- **Controladores**: Endpoints y validaciones
- **Guards**: Autenticación y autorización
- **Utilidades**: Funciones helper

#### Cobertura de Código
- **Objetivo**: >80% de cobertura
- **Herramientas**: Jest + Istanbul
- **Mocks**: Servicios externos y base de datos

### Estructura de Testing
```
src/
├── auth/
│   ├── auth.service.spec.ts
│   ├── auth.controller.spec.ts
│   └── jwt.strategy.spec.ts
├── users/
│   ├── users.service.spec.ts
│   └── users.controller.spec.ts
├── templates/
│   ├── templates.service.spec.ts
│   ├── templates.controller.spec.ts
│   └── TESTING.md
├── training-plans/
│   ├── training-plans.service.spec.ts
│   ├── training-plans.controller.spec.ts
│   └── TESTING.md
└── test/
    └── app.e2e-spec.ts
```

---

## Despliegue

### Docker Configuration

#### Backend Dockerfile
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "start:prod"]
```

#### Docker Compose
```yaml
version: '3.8'
services:
  backend:
    build: ./BackendApp
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - MONGODB_URI=mongodb://mongo:27017/powerlift
    depends_on:
      - mongo
  
  mongo:
    image: mongo:6.0
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db

volumes:
  mongo_data:
```

### Variables de Entorno
```bash
# Database
MONGODB_URI=mongodb://localhost:27017/powerlift

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=24h

# Email
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=your-email@gmail.com
MAIL_PASS=your-app-password

# Server
PORT=3000
NODE_ENV=development
```

---

## Consideraciones de Seguridad

### Validación de Datos
- **Class Validator**: Validación automática de DTOs
- **Sanitización**: Limpieza de datos de entrada
- **Tipos**: TypeScript para validación en tiempo de compilación

### Autenticación
- **JWT**: Tokens seguros con expiración
- **Bcrypt**: Hash de contraseñas
- **Rate Limiting**: Protección contra ataques de fuerza bruta

### Autorización
- **Guards**: Protección de rutas sensibles
- **Roles**: Control de acceso basado en roles
- **Ownership**: Validación de propiedad de recursos

### Base de Datos
- **Índices**: Optimización de consultas
- **Soft Delete**: Preservación de datos críticos
- **Validación**: Schemas de Mongoose

---

## Monitoreo y Logs

### Logging
- **Estructurado**: Logs en formato JSON
- **Niveles**: Error, Warn, Info, Debug
- **Contexto**: Información de usuario y request

### Métricas
- **Performance**: Tiempo de respuesta de APIs
- **Errores**: Tracking de excepciones
- **Uso**: Estadísticas de endpoints más utilizados

---

## Escalabilidad

### Horizontal Scaling
- **Stateless**: Aplicación sin estado
- **Load Balancing**: Distribución de carga
- **Database Sharding**: Particionado de MongoDB

### Vertical Scaling
- **Memory**: Optimización de uso de memoria
- **CPU**: Procesamiento eficiente
- **I/O**: Operaciones asíncronas

---

## Futuras Mejoras

### Funcionalidades
- **Notificaciones Push**: Alertas en tiempo real
- **Video Calls**: Comunicación coach-atleta
- **Analytics**: Métricas avanzadas de rendimiento
- **Mobile App**: Aplicación nativa

### Técnicas
- **Caching**: Redis para cache de datos
- **Message Queue**: Procesamiento asíncrono
- **Microservices**: Separación por dominio
- **GraphQL**: API más flexible

---

## Conclusión

La arquitectura de Powerlift está diseñada para ser:

- **Escalable**: Modular y distribuible
- **Mantenible**: Código limpio y bien documentado
- **Testeable**: Cobertura completa de pruebas
- **Segura**: Autenticación y autorización robustas
- **Flexible**: Fácil extensión de funcionalidades

Esta arquitectura proporciona una base sólida para el crecimiento futuro del sistema y la adición de nuevas funcionalidades.

---