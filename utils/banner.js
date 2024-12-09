import chalk from 'chalk';

const art = `
               ╔═╗╔═╦╗─╔╦═══╦═══╦═══╦═══╗
               ╚╗╚╝╔╣║─║║╔══╣╔═╗║╔═╗║╔═╗║
               ─╚╗╔╝║║─║║╚══╣║─╚╣║─║║║─║║
               ─╔╝╚╗║║─║║╔══╣║╔═╣╚═╝║║─║║
               ╔╝╔╗╚╣╚═╝║╚══╣╚╩═║╔═╗║╚═╝║
               ╚═╝╚═╩═══╩═══╩═══╩╝─╚╩═══╝
               原作者github：github.com/zlkcyber 
               我的gihub：github.com/Gzgod 本人仅做了汉化处理
               我的推特：推特雪糕战神@Hy78516012                  
                                 
`;

export function centerText(text) {
    const lines = text.split('\n');
    const terminalWidth = process.stdout.columns || 80; 
    return lines
        .map(line => {
            const padding = Math.max((terminalWidth - line.length) / 2, 0);
            return ' '.repeat(padding) + line;
        })
        .join('\n');
}

export function showBanner() {
    console.log(chalk.green(centerText(art)));
}
