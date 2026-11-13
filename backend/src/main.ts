import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Aktifkan CORS agar bisa diakses oleh frontend Next.js
  app.enableCors({
    origin: true,
    credentials: true,
  });

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`Backend NestJS berjalan di http://localhost:${port}`);
}
bootstrap();

