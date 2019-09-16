import { Controller, Get, Param, ParseIntPipe, UseFilters, UseInterceptors } from '@nestjs/common';
import { LoggingInterceptor } from '../common/interceptors/logging.interceptor';
import { ProfitService } from './profit.service';
import { ProfitTransactionEntity } from '../common/entities/profitTransactions.entity';
import { HttpExceptionFilter } from '../common/filters/http-exception.filter';

@Controller('/profit')
@UseInterceptors(LoggingInterceptor)
@UseFilters(new HttpExceptionFilter())
export class ProfitController {
  constructor(private readonly profitService: ProfitService) {
  }

  // TODO: Switch to post.
  @Get('/share_all')
  all() {
    this.profitService.shareAll();
    return { status: 'ok' };
  }

  @Get('/progress')
  progress() {
    return this.profitService.progress();
  }

  @Get(':id')
  async findOne(
    //@Param('id') id: string
    @Param('id', new ParseIntPipe())
      id: number,
  ): Promise<ProfitTransactionEntity> {
    return this.profitService.findOne(+id);
  }

  @Get()
  async findAll(): Promise<ProfitTransactionEntity[]> {
    return this.profitService.findAll();
  }

}
