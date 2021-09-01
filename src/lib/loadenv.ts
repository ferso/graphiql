import fs from "fs";
import path from "path";
import dotenv from "dotenv";

const loadenv = () => {
  //set default enviroment
  // ----------------------------------------------
  process.env.ENV = !process.env.ENV ? "dev" : process.env.ENV;
  let envConfig:any = dotenv.config();
  let envFile = path.resolve(`.env.${process.env.ENV}`);
  if (fs.existsSync(envFile)) {
    try {
      envConfig = dotenv.parse(fs.readFileSync(envFile));
      globalThis.logger.debug("Enviroment file loaded ");
      for (const k in envConfig) {
        process.env[k] = envConfig[k];
      }
    } catch (error) {
      globalThis.logger.error(
        `Error try to read Enviroment file [.env.${process.env.ENV}]`
      );
    }
  }
};
loadenv();
export default loadenv;
