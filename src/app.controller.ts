import {Controller, Get, Logger, Param} from '@nestjs/common';
import { AppService } from './app.service';
import {CClient} from "./client/client.entity";
import {ClientService, RepoService} from "./client/client.service";


@Controller()
export class AppController {
  constructor(private readonly appService: AppService,
              private readonly clientService: ClientService) {
  }

  @Get()
  getHello(): string {
    return this.appService.getHello();
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
    return {merchant:merchant, balance: await RepoService.MerchantBalance(merchant)}
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
