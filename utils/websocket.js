import WebSocket from "ws";
import { HttpsProxyAgent } from "https-proxy-agent";
import { generateRandomId, generateRandomSystemData } from "./system.js";
import { delay } from "./file.js";
import { logger } from "./logger.js";

export async function createConnection(token, proxy = null) {
    const wsOptions = {};
    if (proxy) {
        logger(`使用代理连接: ${proxy}`);
        wsOptions.agent = new HttpsProxyAgent(proxy);
    }

    const socket = new WebSocket(`wss://ws.oasis.ai/?token=${token}`, wsOptions);

    socket.on("open", async () => {
        logger(`WebSocket 连接已建立供应商: ${token}`, "", "success");
        const randomId = generateRandomId();
        const systemData = generateRandomSystemData();

        socket.send(JSON.stringify(systemData));
        await delay(2000);

        socket.send(
            JSON.stringify({
                id: randomId,
                type: "heartbeat",
                data: {
                    version: "0.1.7",
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
                        version: "0.1.7",
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
                logger(`心跳已发送供应商: ${token}`);
                logger(`总运行时间: ${totalUptime} 秒 | 赚取的积分:`, creditsEarned);
            } else if (parsedMessage.type === "acknowledged") {
                logger("系统更新:", message, "warn");
            } else if (parsedMessage.type === "error" && parsedMessage.data.code === "Invalid body") {
                const systemData = generateRandomSystemData();
                socket.send(JSON.stringify(systemData));
            }
        } catch (error) {
            logger("解析消息时出错:", "error");
        }
    });

    socket.on("close", () => {
        logger("WebSocket 连接关闭, 令牌:", token, "warn");
        setTimeout(() => {
            logger("尝试重新连接, 令牌:", token, "warn");
            createConnection(token, proxy); 
        }, 5000);
    });

    socket.on("error", (error) => {
        logger("WebSocket 错误, 令牌:", token, "error");
    });
}
