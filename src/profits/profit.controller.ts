import { Controller, Get, Param, ParseIntPipe, Render, Res, UseFilters, UseInterceptors } from '@nestjs/common';
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
  @Render('code')
  all() {
    this.profitService.profitAll();
    return { status: 'ok' };
  }

  @Get('/progress')
  @Render('code')
  progress() {
    return this.profitService.progress();
  }

  @Get(':id')
  @Render('code')
  async findOne(
    //@Param('id') id: string
    @Param('id', new ParseIntPipe())
      id: number,
  ): Promise<ProfitTransactionEntity> {
    return this.profitService.findOne(+id);
  }

  @Get()
  @Render('code')
  async findAll() {
    const pretty = JSON.stringify(await this.profitService.findAll(), null, 2);
    console.log(pretty);
    return { message: pretty };
  }
}
