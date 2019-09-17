import { Controller, Get, Param, ParseIntPipe, Render, UseFilters, UseInterceptors } from '@nestjs/common';
import { LoggingInterceptor } from '../common/interceptors/logging.interceptor';
import { InfoService } from './info.service';
import { ProfitTransactionEntity } from '../common/entities/profitTransactions.entity';
import { HttpExceptionFilter } from '../common/filters/http-exception.filter';

@Controller('/info')
@UseInterceptors(LoggingInterceptor)
@UseFilters(new HttpExceptionFilter())
export class InfoController {
  constructor(private readonly infoService: InfoService) {
  }

  @Get('/:id')
  @Render('info/customer_data')
  async findOne(
    //@Param('id') id: string
    @Param('id', new ParseIntPipe())
      id: number,
  ) {
    return await this.infoService.findOne(+id);
  }

  @Get()
  @Render('info/customer_list')
  async findAll() {
    return { data: await this.infoService.getAllCustomers() };
  }

}
