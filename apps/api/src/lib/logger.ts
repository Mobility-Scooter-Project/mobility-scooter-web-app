import pino from "pino";
import { ENVIRONMENT } from "../config/constants";

const logger = pino({
    level: ENVIRONMENT === "test" ? "silent" : ENVIRONMENT === "production" ? "info" : "debug",
    transport: {
        target: 'pino-pretty',
        options: {
            colorize: ENVIRONMENT === "development",
            sync: ENVIRONMENT === "test",
        }
    }

})

export default logger;