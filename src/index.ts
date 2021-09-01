import "reflect-metadata";
import "./lib/logger";
import "./lib/loadenv";

import apiServer from "./lib/apiServer";
import apollo from "./lib/apollo";
import orm from "./lib/orm";
import tcp from "./lib/tcp";
import sockets from "./lib/sockets";
import controllers from "./lib/controllers";
import "./lib/interfaces/graphiConfig";

declare global {
  var config: any;
}

//load config files
const configpath = `${process.env.PWD}/${process.env.ROOTDIR}/lib/config/default.ts`;
globalThis.config = require(configpath).default;
globalThis.logger.info(`==================================================`);
globalThis.logger.info(`GRAPHIS v1.0`);
globalThis.logger.info(`${process.env.APPNAME}`);
globalThis.logger.info(`==================================================`);

const getInitConfig = (config?: GraphiConfig) => {
  const init: GraphiConfig = {
    tcp: false,
    graphql: false,
    websockets: false,
    controllers: true,
  };
  return { ...init, ...config };
};
const graphis = async (ops?: GraphiConfig) => {
  return new Promise(async (resolver, reject) => {
    const config: GraphiConfig = getInitConfig(ops);
    try {
      //if bootstrap function is defined
      //then is called it before start
      if (config.bootstrap) {
        config.bootstrap();
      }
      //set http server and express
      const { app, server } = apiServer();
      //set orm
      await orm(app).catch((error) => globalThis.logger.error(error));
      //set apollo server
      await apollo(app, server, config);
      //set socketio server
      await sockets(app, server, config);
      //set tcp server
      await tcp(app, server, config);
      //set controllers
      await controllers(app, config);
      //start http server
      server.listen(globalThis.config.port, () => {
        globalThis.logger.warn(
          `Server started at http://localhost:${globalThis.config.port}`
        );
        return resolver("ok");
      });
    } catch (error) {
      globalThis.logger.error(error);
      return reject(error);
    }
  });
};

export default graphis;
