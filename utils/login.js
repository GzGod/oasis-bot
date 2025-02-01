import axios from 'axios';
import { readAccounts, saveToken } from './file.js';
import { logger } from './logger.js';

// 用户注册函数
async function registerUser(email, password) {
    const url = 'https://api.oasis.ai/internal/auth/signup';
    const payload = {
        email: email,
        password: password,
        referralCode: "xgzs"
    }
    const headers = {
        'Content-Type': 'application/json',
    };

    try {
        const response = await axios.post(url, payload, { headers });
        if (response.data) {
            logger('注册成功:', email);
            logger('请检查您的邮箱以获取验证邮件');
            return true;
        }
    } catch (error) {
        logger(`注册错误 ${email}:`, error.response ? error.response.data[0] : error.response.statusText, 'error');
        return null;
    }
}

// 用户登录函数
async function loginUser(email, password) {
    const url = 'https://api.oasis.ai/internal/auth/login';
    const payload = {
        email,
        password,
        rememberSession: true
    }

    const headers = {
        'Content-Type': 'application/json',
    };

    try {
        const response = await axios.post(url, payload, { headers });
        logger('登录成功:', email);
        return response.data.token;
    } catch (error) {
        logger(`登录错误 ${email}:`, error.response ? error.response.data[0] : error.response.statusText, 'error');
        logger('请检查您的邮箱以验证您的邮箱', email, 'error');
        return null;
    }
}

// 主函数
export async function loginFromFile(filePath) {
    try {
        const accounts = await readAccounts(filePath);
        let successCount = 0;

        logger(`尝试登录并获取所有账户的令牌...`)
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
            logger(`${successCount}/${accounts.length} 个账户登录成功。`);
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
