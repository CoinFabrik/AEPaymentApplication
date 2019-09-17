import { Module } from '@nestjs/common';
import { ChainService } from './chain.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CClient } from '../client/client.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CClient])],
  controllers: [],
  providers: [ChainService],
  exports: [ChainService],
})
export class ChainModule {
}
