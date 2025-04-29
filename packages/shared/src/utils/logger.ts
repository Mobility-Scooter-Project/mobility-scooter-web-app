import { ENVIRONMENT } from "@src/config/constants";
import pino from "pino";

export const logger = pino({
    level: ENVIRONMENT === "test" ? "silent" : "info",
    transport: {
        target: 'pino-pretty',
        options: {
            colorize: ENVIRONMENT === "development",
            sync: ENVIRONMENT === "test",
        }
    }

})