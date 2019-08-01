import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import {ClientService} from './client/client.service';
import {CClient} from "./client/client.entity";
import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'path';

let Entities = [CClient];

@Module({
  imports: [
    // TypeOrmModule.forRoot({
    //   type: 'mysql',
    //   host: 'localhost',
    //   port: 3306,
    //   username: 'root',
    //   password: 'root',
    //   database: 'test',
    //   entities: [join(__dirname, '**/**.entity{.ts,.js}')],
    //   synchronize: true,
    // }),
  ],
  controllers: [AppController],
  providers: [AppService, ClientService],
})
export class AppModule {}
