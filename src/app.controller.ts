import {Controller, Get, HttpStatus, Logger, Param, Query, Res} from '@nestjs/common';
import { AppService } from './app.service';
import {CClient} from './client/client.entity';
import {ClientService, RepoService, ServiceBase} from './client/client.service';
import {Response} from 'express';
import {API_URL, MoreConfig} from './config';
import {voidf} from './tools';
const qr = require('qr-image');

@Controller()
export class AppController {
  constructor(private readonly appService: AppService,
              private readonly clientService: ClientService) {
  }

  @Get('/')
  getHome(@Res() res: Response) {
    res.send('Point app at this:<br/>Onboarding Code<br/><iframe width="200" height="200" src="/qr" frameborder="0"></iframe>');
  }

  @Get('/qr')
  async getQR(@Res() res: Response, @Query('data') data: string) {
    await MoreConfig.Init();

    if (data == null) {
      data = JSON.stringify({hub: MoreConfig.QR_HUB_URL});
    } else {
      data = data.toString();
    }

    const code = qr.image(data, { type: 'svg' });
    res.type('svg');
    code.pipe(res);
  }

  @Get('/clients')
  async customers(@Param() params): Promise<string[]> {
    const X = this.clientService.getClients('customer');
    return X.map((x): string => x.address);
  }

  @Get('/merchants')
  async merchants(@Param() params): Promise<any> {
    const X = this.clientService.getClients('merchant');
    return X.map((x): string => x.address);
  }

  @Get('/balance/:merchant')
  async balances(@Param() params): Promise<any> {
    const merchant = params.merchant;
    return {merchant, balance: await RepoService.MerchantBalance(merchant)};
  }

  @Get('/all_merchants')
  async all_merchants(@Param() params): Promise<any> {
    return RepoService.AllMerchants();
  }
  @Get('/all_customers')
  async all_customers(@Param() params): Promise<any> {
    return RepoService.AllCustomers();
  }

  @Get('/leaveall')
  async leaveall(@Param() params): Promise<any> {
    return ServiceBase.leaveAll();
  }

  @Get('/solo')
  async solo(@Param() params): Promise<any> {
    return ServiceBase.forAll((c) => {
      c.channel.solo().then(voidf).catch(console.error);
    });
  }
}
