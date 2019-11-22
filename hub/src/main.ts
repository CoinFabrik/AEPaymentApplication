import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import {MoreConfig} from "./config";
import {getEnv} from "./tools";
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import * as hbs from 'hbs';
import * as express_handlebars from 'express-handlebars';

const ex_hbs = express_handlebars.create({
  partialsDir: join(__dirname, '..', '/views/partials'),
  layoutsDir: join(__dirname, '..', '/views/layouts'),
  defaultLayout: 'main',
  extname: '.hbs',
});

async function bootstrap() {
  // Starts listening to shutdown hooks
  const app = await NestFactory.create<NestExpressApplication>(
    AppModule,
  );
  app.enableShutdownHooks();
  app.engine('hbs', ex_hbs.engine);
  app.set('view engine', 'hbs');
  await MoreConfig.display();
  let PORT = Number.parseInt(getEnv("PORT", "3000"));
  let HOST = getEnv("HOST", "0.0.0.0");
  await app.listen(PORT, HOST);
}

bootstrap();
