import fs from "fs";
import path from "path";
import Http from "http";
import ws from "ws";
import { Express } from "express";
import { RedisClient } from "redis";
import { Server, Socket } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import "./interfaces/graphiConfig";

declare global {
  var io: any;
}

const loadEvents = (socket: Socket) => {
  socket.emit("message", "world2");
  const directory = path.join(
    process.env.PWD || "",
    process.env.ROOTDIR || "",
    "/api/events"
  );
  fs.readdirSync(directory).forEach(async (file) => {
    const filename = file.replace(".ts", "");
    const cbs = path.join(directory, file);
    let event = await import(cbs);
    socket.on(filename, event.default.bind(this, socket));
  });
};

export default async (
  _app: Express,
  server: Http.Server,
  config: GraphiConfig
) => {
  if (config.websockets) {
    try {
      const client = new RedisClient({
        host: process.env.REDIS_HOST,
        port: Number(process.env.REDIS_PORT),
      });
      const io = new Server(server, {
        adapter: createAdapter(client, client),
        cors: {
          origin: "*",
        },
        wsEngine: ws.Server,
        perMessageDeflate: false,
        transports: ["websocket"],
      });

      io.on("connect", () => {
        globalThis.logger.debug(`Starting socket connection `);
      });

      io.on("connection", loadEvents);
      globalThis.io = io;
      globalThis.logger.warn("Websockets enabled");
    } catch (error) {
      globalThis.logger.error("Websockets error %s", error.message);
    }
  }
};
