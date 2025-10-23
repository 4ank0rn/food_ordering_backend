import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable cookies
  app.use(cookieParser());

  // Enable CORS with credentials support
  app.enableCors({
    origin: [process.env.FRONTEND_URL, process.env.ADMIN_URL], // Your frontends
    credentials: true, // Allow cookies to be sent
  });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  await app.listen(process.env.PORT || 3000);
  console.log('Server started on', process.env.PORT || 3000);
}
bootstrap();
