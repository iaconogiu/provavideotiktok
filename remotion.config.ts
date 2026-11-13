import {Config} from '@remotion/cli/config';

Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(92);
Config.setConcurrency(4);
Config.setChromiumOpenGlRenderer('angle');
// usa lo Chromium headless già installato nel sistema, se presente
import fs from 'node:fs';
// (la versione nella cartella cambia da una macchina all'altra: si cerca quella presente)
const PW = '/opt/pw-browsers';
const localShell = fs.existsSync(PW)
  ? fs
      .readdirSync(PW)
      .filter((d) => d.startsWith('chromium_headless_shell-'))
      .flatMap((d) => [`${PW}/${d}/chrome-linux/headless_shell`, `${PW}/${d}/chrome-headless-shell-linux64/chrome-headless-shell`])
      .find((f) => fs.existsSync(f))
  : undefined;
if (localShell) Config.setBrowserExecutable(localShell);
