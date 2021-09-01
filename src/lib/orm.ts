import path from "path";
import fs from "fs";
import { createConnection } from "typeorm";
import { camelize } from "./utilities/string";
import { Express } from "express";

declare global {
  var orm: any;
  var db: any;
}

const getModelName = (src: string) => {
  let name = src.replace(".ts", "");
  name = camelize(name);
  name = `${name.charAt(0).toUpperCase()}${name.slice(1)}`;
  return name;
};
const conn = async (app: Express) => {
  return new Promise(async (resolve, reject) => {
    let modelsPath = path.join(
      process.env.PWD || "",
      process.env.ROOTDIR || "",
      "/api/models/entities"
    );

    try {
      createConnection().then(async (connection) => {
        globalThis.db = connection;
        globalThis.orm = [];
        if (fs.existsSync(modelsPath)) {
          fs.readdirSync(modelsPath).forEach(async (model) => {
            if (model.includes(".ts")) {
              let modelName = getModelName(model);
              let modelFile = await import(path.join(modelsPath, model));
              // console.log(modelFile[modelName])
              globalThis.orm[modelName] = connection.getRepository(
                modelFile[modelName]
              );
            }
          });
        }
        //apply middleware for orm
        app.use((req, _res, next) => {
          req.orm = globalThis.orm;
          next();
        });
        return resolve(true);
      });
    } catch (error) {
      globalThis.logger.error(error);
      return reject("Error trying to up ORM");
    }
  });
};
export default conn;
