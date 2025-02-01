import WebSocket from "ws";
import { HttpsProxyAgent } from "https-proxy-agent";
import { generateRandomId, generateRandomSystemData } from "./system.js";
import { delay } from "./file.js";
import { logger } from "./logger.js";

export async function createConnection(token, proxy = null) {
    const wsOptions = {
        headers: {
            'accept-encoding': 'gzip, deflate, br, zstd',
            'accept-language': 'en-US,en;q=0.9',
            'cache-control': 'no-cache',
            connection: 'Upgrade',
            host: 'ws.oasis.ai',
            origin: 'chrome-extension://knhbjeinoabfecakfppapfgdhcpnekmm',
            pragma: 'no-cache',
            'sec-websocket-extensions': 'permessage-deflate; client_max_window_bits',
            'sec-websocket-version': '13',
            upgrade: 'websocket',
            'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
        }
    };

    if (proxy) {
        logger(`使用代理连接: ${proxy}`);
        wsOptions.agent = new HttpsProxyAgent(proxy);
    }

    const socket = new WebSocket(`wss://ws.oasis.ai/?token=${token}&version=0.1.20&platform=extension`, wsOptions);

    socket.on("open", async () => {
        logger(`WebSocket 连接已建立，提供者: ${token}`, "", "success");
        const randomId = generateRandomId();
        const systemData = generateRandomSystemData();

        socket.send(JSON.stringify(systemData));
        //await delay(1000);

        socket.send(
            JSON.stringify({
                id: randomId,
                type: "heartbeat",
                data: {
                    inferenceState: true,
                    version: "0.1.20",
                    mostRecentModel: "unknown",
                    status: "active",
                },
            })
        );

        setInterval(() => {
            const randomId = generateRandomId();
            socket.send(
                JSON.stringify({
                    id: randomId,
                    type: "heartbeat",
                    data: {
                        inferenceState: true,
                        version: "0.1.20",
                        mostRecentModel: "unknown",
                        status: "active",
                    },
                })
            );
        }, 60000);
    });

    socket.on("message", (data) => {
        const message = data.toString();
        try {
            const parsedMessage = JSON.parse(message);
            if (parsedMessage.type === "serverMetrics") {
                const { totalEarnings, totalUptime, creditsEarned } = parsedMessage.data;
                logger(`发送心跳给提供者: ${token}`);
                logger(`总运行时间: ${totalUptime} 秒 | 获得的积分:`, creditsEarned);
            } else if (parsedMessage.type === "acknowledged") {
                logger("系统已更新:", message, "info");
            } else if (parsedMessage.type === "error" && parsedMessage.data.code === "Invalid body") {
                const systemData = generateRandomSystemData();
                socket.send(JSON.stringify(systemData));
            }
        } catch (error) {
            logger("解析消息时出错:", "error");
        }
    });

    socket.on("close", () => {
        logger("WebSocket 连接关闭，token:", token, "warn");
        setTimeout(() => {
            logger("尝试重新连接，token:", token, "warn");
            createConnection(token, proxy);
        }, 5000);
    });

    socket.on("error", (error) => {
        logger("WebSocket 错误，token:", token, "error");
    });
}
