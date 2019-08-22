import {Body, Controller, Get, Param, Post, Res} from '@nestjs/common';
import {getManager} from "typeorm";
import {Product} from "./products.entity";
import {ReplaceAll, sleep} from "../tools";
import {Response} from "express";

const uuidlib = require('uuid');
const qr = require('qr-image');


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

  @Post("/store")
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

  @Get("/png/:uuid")
  async retrieve_png(@Param() params, @Res() res: Response): Promise<any> {
      let mgr = getManager();
      let product = await mgr.findOne(Product, {uuid: params.uuid});
      let code = qr.image(product.data, {type: "png"});
      res.setHeader('Content-Type', 'image/png')
      code.pipe(res);
  }

  @Get("/svg/:uuid")
  async retrieve_svg(@Param() params, @Res() res: Response): Promise<any> {
      let mgr = getManager();
      let product = await mgr.findOne(Product, {uuid: params.uuid});
      let code = qr.image(product.data, {type: "svg"});
      res.setHeader('Content-Type', 'image/svg+xml');
      code.pipe(res);
  }

  @Get("/")
  async all(@Param() params, @Res() res: Response): Promise<any> {
      let mgr = getManager();
      let products = await mgr.find(Product);
      let item = '<a href="/products/item/uuid">uuid</a><br/>' +
                 '<textarea rows="4" cols="50">data</textarea><br/>' +
                 '<img src="/products/png/uuid"/><br><hr>';
      let result = '<iframe src="/products/new"></iframe> <hr/>';
      for (let product of products) {
          result += ReplaceAll(ReplaceAll(item, "uuid", product.uuid), "data", product.data);
      }
      res.send(result);
  }

  @Get("/item/:uuid")
  async item(@Param() params, @Res() res: Response): Promise<any> {
      let mgr = getManager();
      let product = await mgr.findOne(Product, {uuid: params.uuid});
      let result = `uuid: ${product.uuid} data: ${product.data} qr: <img src="../png/${product.uuid}"/> <hr/>`
      res.send(result);
  }

  @Get("/:uuid")
  async retrieve(@Param() params): Promise<any> {
      let mgr = getManager();
      return await mgr.findOne(Product, {uuid: params.uuid});
  }
}
