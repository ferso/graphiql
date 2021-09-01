import express from "express";
import http from "http";
import cors from "cors";
import helmet from "helmet";

declare module "http" {
  interface IncomingMessage {
    rawBody: any;
    orm: any;
  }
}
const Server = () => {
  const app = express();
  const server = http.createServer(app);
  server.timeout = 0;

  // set middlewares
  // ----------------------------------------------
  //allow Cors
  app.use(cors());
  //body parser
  app.use(
    express.urlencoded({
      extended: true,
      limit: globalThis.config?.upload_limit || "500mb",
      parameterLimit: 50000,
    })
  );
  //json parser
  app.use(
    express.json({
      verify: (req, _res, buf) => {
        req.rawBody = buf;
      },
    })
  );
  //helment security
  app.use(
    helmet({
      contentSecurityPolicy:
        process.env.NODE_ENV === "production" ? undefined : false,
    })
  );
  return { app, server };
};
export default Server;
