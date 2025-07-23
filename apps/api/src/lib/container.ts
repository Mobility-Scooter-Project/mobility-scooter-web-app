import { AuthService } from "@src/services/auth";
import { KVService } from "@src/services/kv";
import { QueueService } from "@src/services/queue";
import { Container } from "inversify";

const container = new Container({ autobind: true });
export const KVSymbol = Symbol.for("KVService");
export const QueueSymbol = Symbol.for("QueueService");

container.bind(KVSymbol).toResolvedValue(async () => {
    return await KVService.build();
}).inSingletonScope();

container.bind(QueueSymbol).toResolvedValue(async () => {
    return await QueueService.build();
}).inSingletonScope();

export default container;