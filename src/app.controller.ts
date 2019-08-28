import {Controller, Get, HttpStatus, Logger, Param, Query, Res} from '@nestjs/common';
import { AppService } from './app.service';
import {CClient} from "./client/client.entity";
import {ClientService, RepoService} from "./client/client.service";
import {Response} from "express";
import {API_URL, MoreConfig} from "./config";
const qr = require('qr-image');


@Controller()
export class AppController {
  constructor(private readonly appService: AppService,
              private readonly clientService: ClientService) {
  }

  @Get("/")
  getHome(@Res() res: Response) {
    res.send('Point app to this:<br/><iframe width="200" height="200" src="/qr" frameborder="0"></iframe>')
  }

  @Get("/qr")  //?data=:data
  async getQR(@Res() res: Response, @Query("data") data: string) {
    await MoreConfig.Init();

    if (data==null) {
      data = JSON.stringify({hub: MoreConfig.QR_HUB_URL});
    } else {
      data = data.toString();
    }

    let code = qr.image(data, { type: 'svg' });
    res.type('svg');
    code.pipe(res);
  }

  @Get("/clients")
  async customers(@Param() params): Promise<string[]> {
    let X = this.clientService.getClients("customer");
    return X.map((x):string => x.address);
  }

  @Get("/merchants")
  async merchants(@Param() params): Promise<any> {
    let X = this.clientService.getClients("merchant");
    return X.map((x):string => x.address);
  }

  @Get("/balance/:merchant")
  async balances(@Param() params): Promise<any> {
    let merchant = params.merchant;
    return {merchant:merchant,
          balance: await RepoService.MerchantBalance(merchant)}
  }

  @Get("/all_merchants")
  async all_merchants(@Param() params): Promise<any> {
    return RepoService.AllMerchants();
  }
  @Get("/all_customers")
  async all_customers(@Param() params): Promise<any> {
    return RepoService.AllCustomers();
  }

}
