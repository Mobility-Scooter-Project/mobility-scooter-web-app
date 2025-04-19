import { COMMON_HEADERS } from "@src/config/common-headers";
import { HTTPException } from "hono/http-exception";
import { ContentfulStatusCode } from "hono/utils/http-status";

/**
 * Custom HTTP Error class that extends HTTPException for handling API errors
 * with support for partial data responses.
 * @extends {HTTPException}
 */
/**
 * @param {ContentfulStatusCode} status - HTTP status code for the error response
 * @param {unknown | string} consoleMessage - Message to be logged in the console
 * @param {string} [clientMessage] - Optional message to be sent to the client. Falls back to consoleMessage if not provided
 * @param {unknown} [cause] - Optional cause of the error
 * @param {any} [partialData] - Optional partial data to be included in the error response
 */
export class HTTPError extends HTTPException {
    constructor(
        status: ContentfulStatusCode,
        consoleMessage: unknown | string,
        clientMessage?: string,
        cause?: unknown,
        partialData?: any
    ) {
        const res = new Response(JSON.stringify({
            data: partialData,
            error: clientMessage || consoleMessage,
        }), {
            headers: COMMON_HEADERS.CONTENT_TYPE_JSON
        });

        const options = { cause, res }
        super(status, options);
    }
}