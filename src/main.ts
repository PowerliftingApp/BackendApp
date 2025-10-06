import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';

async function bootstrap() {
  // Enable CORS with specific options
  const corsOptions: CorsOptions = {
    origin: ['http://localhost:5173', "https://powermind.site" , "https://www.powermind.site"],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  };

  const app = await NestFactory.create(AppModule, {cors: corsOptions});

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
