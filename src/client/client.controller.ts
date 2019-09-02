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
      try {
          const client = await CClient.GetOrCreate(params.address.toString(), this.kind, params.amount.toString(), params.name.toString());
            return this.launchClient(res, client);
      } catch (err) {
              return res.status(HttpStatus.FORBIDDEN).json({error: err.toString()});
      }
  }

  @Get(":address/:amount")
  async connectMerchant2(@Param() params, @Res() res: Response): Promise<any> {
      try {
          const client = await CClient.GetOrCreate(params.address.toString(), this.kind, params.amount.toString());
          return this.launchClient(client, res);
      } catch (err) {
              return res.status(HttpStatus.FORBIDDEN).json({error: err.toString()});
      }
  }

  async launchClient(client: CClient, res: any) {
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
