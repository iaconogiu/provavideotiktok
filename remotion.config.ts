import {Config} from '@remotion/cli/config';

Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(92);
Config.setConcurrency(4);
Config.setChromiumOpenGlRenderer('angle');
// usa lo Chromium headless già installato nel sistema, se presente
import fs from 'node:fs';
const localShell = '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell';
if (fs.existsSync(localShell)) Config.setBrowserExecutable(localShell);
