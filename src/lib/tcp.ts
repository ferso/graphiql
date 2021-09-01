// import fs from "fs";
// import path from "path";
import Http from "http";
import net from "net";
import { StringDecoder } from "string_decoder";
import { Express } from "express";
import "./interfaces/graphiConfig";

declare global {
  var ioClient: any;
}

interface SocketTCP {
  id: number;
  imei: string;
  city_code: string;
  route_id: string;
  vehicle_id: string;
  account_id: string;
  goodbye: Function;
}
type Socket = net.Socket & SocketTCP;
export default async (
  _app: Express,
  _server: Http.Server,
  config: GraphiConfig
) => {
  if (config.tcp) {
    try {
      const tcp_port = process.env.TCP_PORT;
      // Create a new TCP server.
      const server = net.createServer();
      server.listen(tcp_port, () => {
        globalThis.logger.warn(`TCP server at port: ${tcp_port} `);
        // socket dedicated to that client.
        server.on("connection", (socket: Socket) => {
          socket.id = 1;
          socket.write("hello!");
          socket.goodbye = () => {
            console.log(socket.remoteAddress, socket.remotePort);
            socket.write("good bye");
            socket.end();
          };
          socket.on("data", async (buffer: any) => {
            const decoder = new StringDecoder("utf8");
            const text = decoder.write(buffer);
            console.log(text);
            // console.log(
            //   "connection data from %s: %s",
            //   socket.remoteAddress,
            //   text
            // );
            globalThis.ioClient.emit(
              "send-message",
              text.replace(/(\r\n|\n|\r)/gm, "")
            );
            // socket.write(buffer);
          });

          socket.on("end", async () => {
            globalThis.logger.info("connection finished");
          });
          socket.on("error", (error: any) => {
            globalThis.logger.error(error.message);
          });
        });
      });

      //   globalThis.logger.warn("Websockets enabled");
    } catch (error) {
      globalThis.logger.error("TCP error %s", error.message);
    }
  }
};
