import winston from "winston";

declare global {
  var logger: any;
}
const logger = () => {
  globalThis.logger = winston.createLogger({
    silent: false,
    format: winston.format.combine(
      winston.format.splat(),
      winston.format.simple(),
      winston.format.colorize(),
      winston.format.timestamp({
        format: "YYYY-MM-DDTHH:mm:ss",
      }),
      winston.format.printf(
        info => `${info.timestamp} ${info.level}: ${info.message}`
      )
    ),
    transports: [
      new winston.transports.Console({
        level: process.env.LOG_LEVEL || "debug",
      }),
    ],
  });
};
logger()
export default logger;
