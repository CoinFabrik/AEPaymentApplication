import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import {MoreConfig} from "./config";
import {getEnv} from "./tools";

async function bootstrap() {
  // Starts listening to shutdown hooks
  const app = await NestFactory.create(AppModule);
  app.enableShutdownHooks();
  await MoreConfig.display();
  let PORT = Number.parseInt(getEnv("PORT", "3000"));
  let HOST = getEnv("HOST", "0.0.0.0");
  await app.listen(PORT, HOST);
}
bootstrap();
