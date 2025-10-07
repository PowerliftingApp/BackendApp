import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';

async function bootstrap() {
  const corsOptions: CorsOptions = {
    origin: [
      'http://localhost:5173',
      'https://powermind.site',
      'https://www.powermind.site'
    ],
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  };

  const app = await NestFactory.create(AppModule);
  app.enableCors(corsOptions);

  const port = process.env.PORT ?? 3000;
  // Aquí es importante pasar el host 0.0.0.0 para que escuche en todas las interfaces
  await app.listen(port, '0.0.0.0');
  console.log(`🚀 Server running on port ${port}`);
}

bootstrap();
