import fs from 'fs';
import { logger } from './logger.js';

export function readToken(filePath) {
    return new Promise((resolve, reject) => {
        fs.readFile(filePath, 'utf8', (err, data) => {
            if (err) return reject(err);

            const tokens = data.split('\n').map(token => token.trim()).filter(token => token);
            
            if (tokens.length > 0) {
                resolve(tokens);  
            } else {
                reject('未找到任何令牌');
            }
        });
    });
}

export function readAccounts(filePath) {
    return new Promise((resolve, reject) => {
        fs.readFile(filePath, 'utf8', (err, data) => {
            if (err) return reject(err);

            const accounts = data
                .split('\n')
                .map((line, index) => {
                    if (!line.includes('|')) {
                        return null;
                    }

                    const [email, password] = line.split('|').map(part => part?.trim());
                    if (!email || !password) {
                        return null;
                    }

                    return { email, password };
                })
                .filter(account => account !== null); 
            
            if (accounts.length === 0) {
                console.warn("在文件中未找到有效的账户。");
            }

            resolve(accounts);
        });
    });
}

export function saveToken(filePath, token) {
    fs.appendFile(filePath, `${token}\n`, (err) => {
        if (err) {
            logger('保存令牌时出错:', err);
        } else {
            logger('令牌保存成功。');
        }
    });
}

export function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
