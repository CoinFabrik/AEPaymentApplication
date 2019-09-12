import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  // Starts listening to shutdown hooks
  const app = await NestFactory.create(AppModule);
  app.enableShutdownHooks();
  await app.listen(3000, "0.0.0.0");
}
bootstrap();
