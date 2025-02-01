import { readToken, delay } from "./utils/file.js";
import beddu from "./utils/banner.js";
import { loginFromFile } from "./utils/login.js";
import { createProviders } from "./utils/providers.js";
import { logger } from "./utils/logger.js";
import { createInterface } from 'readline';
import fs from 'fs';

const rl = createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function setup() {
  console.log(beddu);
  // 询问要创建的提供者数量
  const input = await askQuestion('输入您想为每个账户创建的提供者数量 [1-100]: ');
  const numProv = parseInt(input, 10);

  if (isNaN(numProv) || numProv < 1 || numProv > 100) {
    logger("无效输入。请输入1到100之间的数字。", "", "error");
    rl.close();
    return;
  };

  const accounts = await readToken("accounts.txt");
  if (fs.existsSync('tokens.txt')) {
    const tokens = await readToken("tokens.txt");

    if (accounts.length !== tokens.length) {
      fs.unlinkSync('tokens.txt');
      const isLogin = await loginFromFile('accounts.txt');
      if (!isLogin) {
        logger("没有账户成功登录。退出...", "", "error");
        rl.close();
        return;
      }
    }
  }

  const isLogin = await loginFromFile('accounts.txt');
  if (!isLogin) {
    logger("没有账户成功登录。退出...", "", "error");
    rl.close();
    return;
  }

  logger(`创建 ${numProv} 个提供者...`);
  await createProviders(numProv);

  rl.close();
}

setup();
