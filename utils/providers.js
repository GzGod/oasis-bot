import { generateRandomId } from "./system.js";
import { readToken, saveToken } from "./file.js";
import { logger } from "./logger.js";
import axios from 'axios';

async function connectWithToken(token) {
    const url = 'https://api.oasis.ai/internal/auth/connect';
    const randomId = generateRandomId();
    const payload = {
        "name": randomId,
        "platform": "headless"
    }

    const headers = {
        'Content-Type': 'application/json',
        'Authorization': token,  
    };

    try {
        const response = await axios.post(url, payload, { headers });
        const logToken = response.data.token;
        logger('创建供应商成功:', logToken);
        return logToken;
    } catch (error) {
        logger('创建供应商出错:', error.response ? error.response.status : error.response.statusText, 'error');
        return null;
    }
}

export async function createProviders(numID) {
    try {
        const tokens = await readToken('tokens.txt');
        for (const token of tokens) { 
            logger(`使用令牌创建供应商: ${token}`);
            for (let i = 0; i < numID; i++) {
                logger(`创建第 ${i + 1} 个供应商....`);
                const logToken = await connectWithToken(token);
                if (logToken) {
                    saveToken("providers.txt", logToken)
                } else {
                    logger('创建供应商失败', '', 'error');
                    continue;
                }
            };
            
        };
        return true;
    } catch (error) {
        logger("读取令牌或连接时出错:", error, 'error');
    };
};
