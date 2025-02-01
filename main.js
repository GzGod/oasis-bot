import { readToken, delay } from "./utils/file.js";
import { createConnection } from "./utils/websocket.js";
import beddu from "./utils/banner.js";
import { logger } from "./utils/logger.js";

async function start() {
    console.log(beddu);
    const tokens = await readToken("providers.txt");
    const proxies = await readToken("proxy.txt");

    if (proxies.length === 0) {
        logger("未找到代理 - 无代理运行中...", "", "warn");
    }

    // 使用每个token一个代理创建连接
    for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];
        const proxy = proxies[i % proxies.length] || null;

        await createConnection(token, proxy);
        await delay(1000);
    }
}

start();
