import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
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
  await app.listen(3000, '0.0.0.0');
}

bootstrap();
