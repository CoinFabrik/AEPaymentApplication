import {Controller, Get, Param} from '@nestjs/common';
import { AppService } from './app.service';
import {CClient} from "./client/client.entity";
import {ClientService} from "./client/client.service";

@Controller()
export class AppController {
  constructor(private readonly appService: AppService,
              private readonly clientService: ClientService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get("/client/:id")
  async connectClient(@Param() params): Promise<object> {
    const client: CClient = new CClient();
    client.address = params.id.toString();
    console.log(client);
    return this.clientService.connect(client, "customer");
  }

  @Get("/merchant/:id")
  async connectMerchant(@Param() params): Promise<object> {
    const client: CClient = new CClient();
    client.address = params.id.toString();
    console.log(client);
    return this.clientService.connect(client, "merchant");
  }

  @Get("/clients")
  async customers(@Param() params): Promise<string[]> {
    let X = this.clientService.getClients();
    return X.map((x):string => x.address);
  }

  @Get("/merchants")
  async merchants(@Param() params): Promise<any> {
    return []
  }
}
