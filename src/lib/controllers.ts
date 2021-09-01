import fs from "fs";
import path from "path";
import { Express, Request, Response, NextFunction } from "express";
import "./interfaces/graphiConfig";

// dynamically include routes (Controller)
// ----------------------------------------------
const controllers = async (app: Express, config: GraphiConfig) => {
  if (config.controllers) {
    if (process.env.PWD) {
      let controllersPath = path.join(
        process.env.PWD || "",
        process.env.ROOTDIR || "",
        "/api/controllers"
      );
      if (fs.existsSync(controllersPath)) {
        fs.readdirSync(controllersPath).forEach((controller) => {
          //set directory path in controllers
          let controllerPath = path.join(controllersPath, controller);
          if (fs.lstatSync(controllerPath).isDirectory()) {
            fs.readdirSync(controllerPath).forEach((action) => {
              let actionPath = path.join(controllersPath, controller, action);
              let actionFunction = require(actionPath).default;

              //define action method
              let methods = /post|get|put|delete/;
              let actionFileName = action
                .replace(".ts", "")
                .replace(methods, "")
                .toLowerCase();

              let actionName =
                actionFileName === "index"
                  ? `/${controller}`
                  : `/${controller}/${actionFileName}`;

              if (actionName === "/index") {
                actionName = "/";
              }
              switch (true) {
                case action.indexOf("post") === 0:
                  app.post(actionName, actionFunction);
                  break;
                case action.indexOf("get") === 0:
                  app.get(actionName, actionFunction);
                  break;
                default:
                  app.all(actionName, actionFunction);
                  break;
              }
            });
          }
        });
        globalThis.logger.warn(`Controllers are enableds`);
      } else {
        globalThis.logger.warn(
          `Cannot find the controllers directory, because scheme was no found, ${controllersPath}`
        );
      }
    }
  }
  //bad request
  app.use((_req: Request, res: Response, _next: NextFunction) => {
    res.status(500).send("Bad request");
  });
};

export default controllers;
