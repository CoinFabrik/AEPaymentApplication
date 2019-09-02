import {Controller, Get, HttpStatus, Param, Res} from '@nestjs/common';
import {AppService} from "../app.service";
import {ClientService, RepoService} from "./client.service";
import {ServerChannel} from "./channel";
import {Actor, CClient} from "./client.entity";
import { Response } from 'express';
import {Hub} from "./hub";

abstract class ClientController {
  constructor(private readonly clientService: ClientService) {
      setTimeout( () => {
          console.log("1-------- this is:", this);
      }, 0);
  }

  get service(): ClientService {
      if (this.clientService!=undefined)
          return this.clientService;
      return Hub.Get().service;
  }

  abstract get kind(): Actor;

  @Get("history/:address/:start/:take")
  async history3(@Param() params): Promise<any> {
      return RepoService.getHistory(this.kind, params.address, params.start, params.take);
  }

  @Get("history/:address/:start")
  async history2(@Param() params): Promise<any> {
      return RepoService.getHistory(this.kind, params.address, params.start);
  }

  @Get("history/:address")
  async history(@Param() params): Promise<any> {
      return RepoService.getHistory(this.kind, params.address);
  }

  @Get(":address/:amount/:name")
  async connectMerchant(@Param() params, @Res() res: Response): Promise<any> {
      return this.launchClient(res, this.kind, params.address.toString(),
                                params.amount.toString(), params.name.toString());
  }

  @Get(":address/:amount")
  async connectMerchant2(@Param() params, @Res() res: Response): Promise<any> {
      return this.launchClient(res, this.kind, params.address.toString(),
                                params.amount.toString());
  }

  async launchClient(res, kind: Actor, address, amount: string, name?:string) {
      let save = false;
      let client = await this.service.queryClient(address, this.kind);
      if (client==undefined) {
          if (name==undefined) {
              return res.status(HttpStatus.FORBIDDEN).json({"error": "no name"});
          }
          client = new CClient();
          client.kind = kind;
          client.address = address;
          client.amount = amount;
          client.name = name;
      }

      if(client.amount!==amount) {
          save = true;
          client.amount = amount;
      }
      if(client.name!==name) {
          save = true;
          client.name = name;
      }
      if(save) {
          client = await client.tsave();
      }

      // TO DO : revisar
      // if(this.service.isOnOrPendingClientByAddress(address, kind)){
      //     console.log("already connected:", address);
      //     return res.status(HttpStatus.TEMPORARY_REDIRECT).json({"error": "already connected"});
      // }
      let result = await this.service.connect(client);
      console.log("client:", JSON.stringify(result));
      return res.json(result);
  }

  @Get("all")
  async queryClients(@Param() params): Promise<any> {
      return await this.service.queryClients(this.kind);
  }

  @Get(":address")
  async queryClient(@Param() params): Promise<any> {
      let result = await this.service.queryClient(params.address, this.kind);
      let response = ServerChannel.GetNameInfo();
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
