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
                reject('No tokens found');
            }
        });
    });
}

export function readAccounts(filePath) {
    return new Promise((resolve, reject) => {
        fs.readFile(filePath, 'utf8', (err, data) => {
            if (err) return reject(err);
            const accounts = data.split('\n').map(line => {
                const [email, password] = line.split('|');
                return { email: email.trim(), password: password.trim() };
            }).filter(account => account.email && account.password); 
            resolve(accounts);
        });
    });
};

export function saveToken(filePath, token) {
    fs.appendFile(filePath, `${token}\n`, (err) => {
        if (err) {
            logger('Error saving token:', err);
        } else {
            logger('Token saved successfully.');
        }
    });
}
export function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}