'use strict';

import os from 'os';
import express from 'express';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import chalk from 'chalk';
import cfonts from 'cfonts';

const { say } = cfonts;

say("ANNA - MD", {
  'font': "block",
  'align': "center",
  'colors': ['#ff9900'],
  'background': "transparent",
  'letterSpacing': 1,
  'lineHeight': 1,
  'space': true,
  'maxLength': '15'
});

say("QUEEN-ANNA By toge012345._.", {
  'font': "chrome",
  'align': "center",
  'colors': ["red", "magenta"],
  'background': "transparent",
  'letterSpacing': 1,
  'lineHeight': 1,
  'space': true,
  'maxLength': '30'
});

const app = express();
const port = process.env.PORT || 8080;
const basePath = decodeURIComponent(new URL(import.meta.url).pathname);
const htmlDir = path.join(path.dirname(basePath), 'Assets');

// Serve HTML pages
const sendHtml = (res, page) => {
  res.sendFile(path.join(htmlDir, page + ".html"));
};

app.get('/', (req, res) => sendHtml(res, "Anna"));

app.listen(port, () => {
  console.log(chalk.green(`Server is running on port ${port}`));
});

let isRunning = false;

async function start(scriptName) {
  if (isRunning) return;
  isRunning = true;

  const currentScriptPath = decodeURIComponent(new URL(import.meta.url).pathname);
  const scriptArgs = [path.join(path.dirname(currentScriptPath), scriptName), ...process.argv.slice(2)];

  const childProcess = spawn(process.argv[0], scriptArgs, {
    'stdio': ["inherit", "inherit", "inherit", "ipc"]
  });

  childProcess.on("message", msg => {
    console.log(chalk.cyan(`✔️ RECEIVED: ${msg}`));
    switch (msg) {
      case "reset":
        childProcess.kill();
        isRunning = false;
        start.apply(this, arguments);
        break;
      case 'uptime':
        childProcess.send(process.uptime());
        break;
    }
  });

  childProcess.on("exit", exitCode => {
    isRunning = false;
    console.error(chalk.red(`❌ Exited with code: ${exitCode}`));
    if (exitCode === 0) return;
    fs.watchFile(scriptArgs[0], () => {
      fs.unwatchFile(scriptArgs[0]);
      start("anna-core.js");
    });
  });

  childProcess.on("error", err => {
    console.error(chalk.red(`Error: ${err}`));
    childProcess.kill();
    isRunning = false;
    start('anna-core.js');
  });

  const pluginsDir = path.join(path.dirname(currentScriptPath), "plugins");

  fs.readdir(pluginsDir, async (err, files) => {
    if (err) {
      console.error(chalk.red(`Error reading plugins folder: ${err}`));
      return;
    }
    console.log(chalk.yellow(`Installed ${files.length} plugins`));
    try {
      const { default: baileys } = await import("@whiskeysockets/baileys");
      const latestBaileysVersion = (await baileys.fetchLatestBaileysVersion()).version;
      console.log(chalk.yellow(`Using Baileys version ${latestBaileysVersion}`));
    } catch (err) {
      console.error(chalk.red(" Baileys library is not installed"));
    }
  });
}

start('anna-core.js');


process.on("unhandledRejection", () => {
  console.error(chalk.red("Unhandled promise rejection. Bot will restart..."));
  start("anna-core.js");
});


process.on("exit", exitCode => {
  console.error(chalk.red(`Exited with code: ${exitCode}`));
  console.error(chalk.red("Bot will restart..."));
  start("anna-core.js");
});
