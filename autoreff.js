import Mailjs from "@cemalgnlts/mailjs";
import axios from "axios";
import fs from 'fs';
import { HttpsProxyAgent } from 'https-proxy-agent';
import readline from "readline/promises";
import { delay } from "./utils/file.js";
import { logger } from "./utils/logger.js";
import { showBanner } from "./utils/banner.js";

const mailjs = new Mailjs();

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

function extractCodeFromEmail(text) {
    const regex = /code=([A-Za-z0-9]+)/;
    const match = text.match(regex);
    return match ? match[1] : null;
}

function readProxies(filePath) {
    return new Promise((resolve, reject) => {
        fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) return reject(err);
        const proxies = data.split('\n').map(proxy => proxy.trim()).filter(proxy => proxy);
        resolve(proxies);
        });
    });
}

async function verifyEmail(code, proxy) {
    const proxyAgent = new HttpsProxyAgent(proxy);
    const url = "https://api.oasis.ai/internal/authVerifyEmail?batch=1";
    const payload = {
        "0": {
            json: {
                token: code,
            },
        },
    };

    try {
        const response = await axios.post(url, payload, {
            headers: { "Content-Type": "application/json" },
            httpsAgent: proxyAgent,
        });
        return response.data[0].result.data;
    } catch (error) {
        logger(
            "验证电子邮件时出错:",
            error.response ? error.response.data : error.message,
            'error'
        );
        return null;
    }
}

// 检查新邮件
async function checkForNewEmails(proxy) {
    try {
        const emailData = await mailjs.getMessages();
        const latestEmail = emailData.data[0];

        if (latestEmail) {
            logger("收到新邮件:", latestEmail.subject);
            const msgId = latestEmail.id;

            const emailMessage = await mailjs.getMessage(msgId);
            const textContent = emailMessage.data.text;

            if (textContent) {
                const verificationCode = extractCodeFromEmail(textContent);
                if (verificationCode) {
                    const verifyResult = await verifyEmail(verificationCode, proxy);
                    if (verifyResult) {
                        logger("电子邮件验证成功:", verifyResult.json.message, 'success');
                        return true; 
                    } else {
                        await verifyEmail(verificationCode, proxy);
                    }
                }
            } else {
                logger("邮件中没有文本内容。", '', 'error');
            }

            await mailjs.deleteMessage(msgId);
        }
        return false;
    } catch (error) {
        logger("检查新邮件时出错:", error, 'error');
        return false;
    }
}

// 发送注册请求
async function sendSignupRequest(email, password, proxy, referralCode) {
    const proxyAgent = new HttpsProxyAgent(proxy);
    const url = "https://api.oasis.ai/internal/authSignup?batch=1";
    const payload = {
        "0": {
            json: {
                email,
                password,
                referralCode,
            },
        },
    };

    try {
        const response = await axios.post(url, payload, {
            headers: { "Content-Type": "application/json" },
            httpsAgent: proxyAgent,
        });
        logger(`注册成功 for`, email, 'success');
        return { email, status: "success", data: response.data };
    } catch (error) {
        const errorMessage = error.response
            ? error.response.statusText
            : error.message;
        logger(`注册时出错 ${email}:`, errorMessage, 'error');
        return null;
    }
}

async function saveAccountToFile(email, password) {
    const account = `${email}|${password}\n`; 
    fs.appendFileSync("accountsReff.txt", account, (err) => {
        if (err) {
            logger("保存账户时出错:", err, 'error');
        } else {
            logger("账户成功保存到 accounts.txt。");
        }
    });
}

// 主流程
async function main() {
    try {
        showBanner()
        const proxies = await readProxies('proxy.txt');
        if (proxies.length === 0) {
            throw new Error('proxy.txt 中没有可用的代理');
        }
        const referralCode = await rl.question("请输入您的推荐代码: ");
        const numAccounts = await rl.question("你想要创建多少个账户: ");
        const totalAccounts = parseInt(numAccounts);
        if (isNaN(totalAccounts) || totalAccounts <= 0) {
            logger("请输入有效的账户数量。", '', 'warn');
            return;
        }

        for (let i = 1; i <= totalAccounts; i++) {
            const proxy = proxies[i % proxies.length];
            logger(`正在创建第 ${i} 个账户，共 ${totalAccounts} 个...`);

            try {
                const account = await mailjs.createOneAccount();

                if (!account.status || !account.data) {
                    logger(`创建第 ${i} 个账户出错:`, account.error || "速率限制，5秒后重试...", 'error');
                    i--; 
                    await delay(5000);
                    continue;
                }

                const username = account.data.username;
                const password = account.data.password;
                logger(`账户 ${i} 创建成功:`, username);

                mailjs.on("open", () => logger(`等待第 ${i} 个账户的验证邮件...`));
                
                let isSignup = await sendSignupRequest(username, password, proxy, referralCode);
                while (!isSignup) {
                    isSignup = await sendSignupRequest(username, password, proxy, referralCode);
                    await delay(5000);
                }

                let isEmailVerified = false;
                while (!isEmailVerified) {
                    isEmailVerified = await checkForNewEmails(proxy);
                    if (!isEmailVerified) {
                        await delay(5000); 
                    }
                }

                mailjs.on("arrive", () => onNewMessageReceived(i, username, password, proxy));
                await delay(10000);
            } catch (error) {
                logger(`创建第 ${i} 个账户时出错:`, error, 'error');
            }
        }

        rl.close();
    } catch (error) {
        logger("错误:", error.message || error, 'error');
        rl.close();
    }
}

async function onNewMessageReceived(i, username, password, proxy) {
    try {
        logger(`第 ${i} 个账户收到新消息。正在处理...`);
        await checkForNewEmails(proxy);

        mailjs.off();
        saveAccountToFile(username, password);
    } catch (error) {
        logger("处理新消息时出错:", error, 'error');
    }
}

main();
