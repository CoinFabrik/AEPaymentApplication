import {Controller, Get, HttpStatus, Param, Res} from '@nestjs/common';
import {AppService} from "../app.service";
import {ClientService, RepoService} from "./client.service";
import {ServerChannel} from "./channel";
import {Actor, CClient} from "./client.entity";
import { Response } from 'express';
import {Hub} from "./hub";
import {getRepository} from "typeorm";

abstract class ClientController {
  constructor(private readonly clientService: ClientService) { }

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

  @Get("reset/:address")
  async resetoffline(@Param() params): Promise<any> {
      let repo = getRepository(CClient);
      let result = "ok";
      let client = await repo.findOne({address: params.address.toString(), kind: this.kind});
      if (client!=undefined) {
          client.channelSt = null;
          client.channelId = null;
          client.save();
      } else {
          result = "not found";
      }
      return {result};
  }

  @Get(":address/:amount/:name")
  async connectMerchant(@Param() params, @Res() res: Response): Promise<any> {
      try {
          const client = await CClient.GetOrCreate(params.address.toString(), this.kind, params.amount.toString(),
                                                    params.name.toString());
          return this.launchClient(client, res);
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
      let result = await this.service.connect(client);
      return res.json(result);
  }

  @Get("all")
  async queryClients(@Param() params): Promise<any> {
      return await this.service.queryClients(this.kind);
  }

  @Get(":address")
  async queryClient(@Param() params): Promise<any> {
      const result = await CClient.Get(params.address.toString(), this.kind);
      let response = ServerChannel.GetNameInfo();
      let name = null;
      let channelId = null;
      if (result!=undefined) {
          name = result.name;
          channelId = result.channelId;
      }
      response["name"] = name;
      response["channelId"] = channelId;
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
