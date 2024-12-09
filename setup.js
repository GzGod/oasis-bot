import { readToken, delay } from "./utils/file.js";
import { showBanner } from "./utils/banner.js";
import { loginFromFile } from "./utils/login.js";
import { createProviders } from "./utils/providers.js";
import { logger } from "./utils/logger.js";
import { createInterface } from 'readline';

const rl = createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function setup() {
  showBanner();
  // 询问创建供应商的数量
  const input = await askQuestion('请输入您想要创建的供应商数量 [1-100]: ');
  const numProv = parseInt(input, 10);
  
  if (isNaN(numProv) || numProv < 1 || numProv > 100) {
    logger("输入无效。请输入1到100之间的数字。", "", "error");
    rl.close();
    return;
  }
  
  const proxies = await readToken("proxy.txt");
  const isLogin = await loginFromFile('accounts.txt');

  if (proxies.length === 0) { 
    logger('在proxy.txt中未找到任何代理。程序退出...', "", "error");
    rl.close();
    return; 
  }
  if (!isLogin) {
    logger("没有账户成功登录。程序退出...", "", "error");
    rl.close();
    return; 
  }

  logger(`正在创建 ${numProv} 个供应商...`);
  await createProviders(numProv);
  
  rl.close();
}

setup();
