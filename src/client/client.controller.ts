import {Controller, Get, HttpStatus, Param, Res} from '@nestjs/common';
import {AppService} from "../app.service";
import {ClientService} from "./client.service";
import {ServerChannel} from "./channel";
import {Actor, CClient} from "./client.entity";
import { Response } from 'express';
import {Hub} from "./hub";

abstract class ClientController {
  constructor(  //private readonly appService: AppService,
              private readonly clientService: ClientService) {
      setTimeout( () => {
          console.log("1-------- this is:", this);
      }, 0);
  }

  get service(): ClientService {
      if (this.clientService!=undefined)
          return this.clientService;
      return Hub.Get().service;
  }

  abstract get kind(): Actor ;

  @Get(":address/:amount/:name")
  async connectMerchant(@Param() params, @Res() res: Response): Promise<any> {
      return this.launchClient(this.kind, params.address.toString(),
                                params.name.toString(), params.amount.toString(), res);
  }

  @Get(":address/:amount")
  async connectMerchant2(@Param() params, @Res() res: Response): Promise<any> {
      let result = await this.service.queryClient(params.address, this.kind);
      if (result==undefined) {
          return {"error": "No name specified!!"};
      }
      return this.launchClient(this.kind, params.address.toString(),
                                result.name, params.amount.toString(), res);
  }

  launchClient(kind: Actor, address, name, amount: string, res: any) {
      const client: CClient = new CClient();
      client.kind = kind;
      client.address = address;
      client.amount = amount;
      client.name = name;
      // TO DO : revisar
      // if(this.service.isOnOrPendingClientByAddress(address, kind)){
      //     console.log("already connected:", address);
      //     return res.status(HttpStatus.TEMPORARY_REDIRECT).json({"error": "already connected"});
      // }
      return res.json(this.service.connect(client));
  }

  @Get("all")
  async queryClients(@Param() params): Promise<any> {
      return await this.service.queryClients(this.kind);
  }

  @Get(":address")
  async queryClient(@Param() params): Promise<any> {
      let result = await this.service.queryClient(params.address, this.kind);
      let response = ServerChannel.GetInfo();
      let name = null;
      if (result!=undefined) {
          name = result.name;
      }
      response["name"] = name;
      return response;
  }
}

@Controller('merchant')
export class MerchantController extends ClientController {
    get kind(): Actor {
        return "merchant";
    }
}


@Controller('client')
export class CustomerController extends ClientController {
    get kind(): Actor {
        return "customer";
    }
}
