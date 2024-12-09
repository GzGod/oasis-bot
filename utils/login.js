import axios from 'axios';
import { readAccounts, saveToken } from './file.js';
import { logger } from './logger.js';

// 用户注册函数
async function registerUser(email, password) {
    const url = 'https://api.oasis.ai/internal/authSignup?batch=1';
    const payload = {
        "0": {
            "json": {
                email: email,
                password: password, 
                referralCode: "zlketh"
            }
        }
    };
    const headers = {
        'Content-Type': 'application/json',
    };

    try {
        const response = await axios.post(url, payload, { headers });
        if (response.data[0].result) {
            logger('注册成功:', email);
            logger('请检查您的邮箱以获取验证邮件');
            return true;
        }
    } catch (error) {
        logger(`注册时出错 ${email}:`, error.response ? error.response.data[0] : error.response.statusText, 'error');
        return null; 
    }
}

// 用户登录函数
async function loginUser(email, password) {
    const url = 'https://api.oasis.ai/internal/authLogin?batch=1';
    const payload = {
        "0": {
            "json": {
                email: email,
                password: password,
                rememberSession: true
            }
        }
    };

    const headers = {
        'Content-Type': 'application/json',
    };

    try {
        const response = await axios.post(url, payload, { headers });
        logger('登录成功:', email);
        return response.data[0].result.data.json.token;
    } catch (error) {
        logger(`登录时出错 ${email}:`, error.response ? error.response.data[0] : error.response.statusText, 'error');
        logger('请检查您的邮箱以验证您的电子邮件', email, 'error');
        return null; 
    }
}

// 主函数
export async function loginFromFile(filePath) {
    try {
        const accounts = await readAccounts(filePath);
        let successCount = 0;

        for (const account of accounts) {
            logger(`尝试登录 ${account.email}`);
            const token = await loginUser(account.email, account.password);
            if (token) {
                saveToken('tokens.txt', token);
                successCount++;
            } else {
                logger(`尝试注册 ${account.email}`);
                await registerUser(account.email, account.password);
            }
        }

        if (successCount > 0) {
            logger(`${successCount}/${accounts.length} 个账户成功登录。`);
            return true; 
        } else {
            logger("所有账户登录失败。", "", "error");
            return false; 
        }
    } catch (error) {
        logger("读取账户或处理登录时出错:", error, "error");
        return false; 
    }
}
