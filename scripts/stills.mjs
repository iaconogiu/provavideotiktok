// Renderizza fotogrammi di controllo (secondi passati come argomenti) in una cartella
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';
import path from 'node:path';
import fs from 'node:fs';

const [outDir, ...secs] = process.argv.slice(2);
fs.mkdirSync(outDir, {recursive: true});
const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts')});
const browserExecutable = '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell';
const composition = await selectComposition({serveUrl, id: process.env.COMP || 'PullmanVideo', browserExecutable});
for (const s of secs) {
  const frame = Math.round(Number(s) * composition.fps);
  await renderStill({composition, serveUrl, frame, output: path.join(outDir, `t${String(s).padStart(5, '0')}.jpg`), imageFormat: 'jpeg', scale: 0.4, browserExecutable});
  console.log('ok', s);
}
