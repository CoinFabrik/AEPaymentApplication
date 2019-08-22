import {Body, Controller, Get, Param, Post, Res} from '@nestjs/common';
import {getManager} from "typeorm";
import {Product} from "./products.entity";
import {sleep} from "../tools";
import {Response} from "express";

const uuidlib = require('uuid');


@Controller('products')
export class ProductsController {

  @Get("/new")
  async create(@Res() res: Response): Promise<any> {
      let html = '<form action="./store" method="POST">\n' +
          '  <div>\n' +
          '    <label for="say">uuid</label>\n' +
          '    <input name="uuid" id="uuid" value="'+uuidlib()+'">\n' +
          '  </div>\n' +
          '  <div>\n' +
          '    <label for="to">data</label>\n' +
          '    <input name="data" id="data" value="">\n' +
          '  </div>\n' +
          '  <div>\n' +
          '    <button>Send</button>\n' +
          '  </div>\n' +
          '</form>';
      res.send(html)
  }

  @Post("store")
  async store(@Param() params, @Body("uuid") uuid: string, @Body("data") data: string): Promise<any> {
      let element = new Product();
      element.data = data;
      if (uuid==null) {
          element.uuid = uuidlib();
      } else {
          element.uuid = uuid;
      }

      while(true) {
          try{
              let mgr = getManager();
              element = await mgr.save(element);
              return {"result": "ok", "uuid": element.uuid}
          } catch (err) {
              await sleep(500);
          }
      }
  }

  @Get("/:uuid")
  async retrieve(@Param() params): Promise<any> {
      let mgr = getManager();
      return await mgr.findOne(Product, {uuid: params.uuid});
  }

}
