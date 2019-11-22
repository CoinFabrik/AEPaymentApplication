import { Controller, Get, Param, ParseIntPipe, UseFilters, UseInterceptors } from '@nestjs/common';
import { LoggingInterceptor } from '../common/interceptors/logging.interceptor';
import { CloseService } from './close.service';
import { ClosedTransactionEntity } from '../common/entities/closedTransactions.entity';
import { HttpExceptionFilter } from '../common/filters/http-exception.filter';

@Controller('/close')
@UseInterceptors(LoggingInterceptor)
@UseFilters(new HttpExceptionFilter())
export class CloseController {
  constructor(private readonly closeService: CloseService) {
  }

  // TODO: Switch to post.
  @Get('/all')
  all() {
    this.closeService.closeAll();
    return { status: 'ok' };
  }

  @Get('/progress')
  progress() {
    return this.closeService.progress();
  }

  @Get(':id')
  async findOne(
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
