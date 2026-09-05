import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  const port = process.env.PORT ?? 4000;
  await app.listen(port);
  console.log(`🚀 API server is running on http://localhost:${port}`);
}
bootstrap();
