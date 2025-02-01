import { generateRandomId } from "./system.js";
import { readToken, saveToken } from "./file.js";
import { logger } from "./logger.js";
import axios from 'axios';
import fs from 'fs';

async function connectWithToken(token) {
    const url = 'https://api.oasis.ai/internal/auth/connect';
    const randomId = generateRandomId();
    const payload = {
        "name": randomId,
        "platform": "browser"
    }

    const headers = {
        'Content-Type': 'application/json',
        'Authorization': token,
    };

    try {
        const response = await axios.post(url, payload, { headers });
        const logToken = response.data.token;
        logger('创建提供者成功:', logToken);
        return logToken;
    } catch (error) {
        logger('创建提供者错误:', error.response ? error.response.status : error.response.statusText, 'error');
        return null;
    }
}

async function getAllProviders(token) {
    const url = 'https://api.oasis.ai/internal/provider/providers?limit=100';

    const headers = {
        'Authorization': token,
    };

    try {
        const response = await axios.get(url, { headers });
        const data = response.data;
        logger('获取所有现有提供者成功');
        return data;
    } catch (error) {
        logger('获取所有现有提供者错误:', error.response ? error.response.status : error.response.statusText, 'error');
        return null;
    }
}

async function deleteProviders(token, nodeId) {
    const url = `https://api.oasis.ai/internal/provider/?id=${nodeId}`;
    const headers = {
        'Authorization': token,
    };

    try {
        const response = await axios.delete(url, { headers });
        const data = response.data;
        logger('删除提供者成功');
        return data;
    } catch (error) {
        logger('删除提供者错误:', error.response ? error.response.status : error.response.statusText, 'error');
        return null;
    }
}

export async function createProviders(numID) {
    try {
        const tokens = await readToken('tokens.txt');
        const filePath = 'providers.txt';

        if (fs.existsSync(filePath)) {
            try {
                fs.unlinkSync(filePath);
                logger(`${filePath} 已删除。`);
            } catch (err) {
                logger(`删除 ${filePath} 时出错:`, 'error');
            }
        }

        for (const token of tokens) {
            logger(`使用令牌检查所有提供者: ${token}`);
            const response = await getAllProviders(token)
            const nodeIds = response.results.map(item => item.id);
            logger(`找到 ${nodeIds.length} 个现有提供者 - 尝试删除旧提供者...`);
            for (const nodeId of nodeIds) {
                await deleteProviders(token, nodeId)
            }

            logger(`使用令牌创建提供者: ${token}`);
            for (let i = 0; i < numID; i++) {
                logger(`创建提供者 #${i + 1}....`);
                const logToken = await connectWithToken(token);
                if (logToken) {
                    saveToken("providers.txt", logToken)
                } else {
                    logger('创建提供者失败', 'error', 'error');
                    continue;
                }
            };

        };
        return true;
    } catch (error) {
        logger("读取令牌或连接时出错:", error, 'error');
    };
};
