import { Controller, Get, HttpStatus, Logger, Param, ParseIntPipe, Query, Res, UseInterceptors } from '@nestjs/common';
import { AppService } from '../app.service';
import { CClient } from '../client/client.entity';
import { ClientService, RepoService, ServiceBase } from '../client/client.service';
import { Response } from 'express';
import { API_URL, MoreConfig } from '../config';
import { voidf } from '../tools';
import { LoggingInterceptor } from '../common/interceptors/logging.interceptor';
import { CloseService } from './close.service';
import { ClosedTransactionEntity } from './closedTransactions.entity';

@Controller('/close')
@UseInterceptors(LoggingInterceptor)
export class CloseController {
  constructor(private readonly closeService: CloseService) {
  }

  @Get('/all')
  all() {
    this.closeService.closeAll();
    return { status: 'ok' };
  }

  @Get(':id')
  async findOne(
    //@Param('id') id: string
    @Param('id', new ParseIntPipe())
      id: number,
  ): Promise<ClosedTransactionEntity> {
    return this.closeService.findOne(+id);
  }

  @Get()
  async findAll(): Promise<ClosedTransactionEntity[]> {
    return this.closeService.findAll();
  }

}
