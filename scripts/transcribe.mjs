// Trascrive ./voce.mp3 con whisper.cpp e salva i timestamp parola per parola in src/transcript.json
import path from 'node:path';
import fs from 'node:fs';
import {execSync} from 'node:child_process';
import {
  downloadWhisperModel,
  installWhisperCpp,
  transcribe,
  toCaptions,
} from '@remotion/install-whisper-cpp';

const whisperPath = path.join(process.cwd(), 'whisper.cpp');
const MODEL = 'large-v3-turbo';

await installWhisperCpp({to: whisperPath, version: '1.7.6'});
await downloadWhisperModel({model: MODEL, folder: whisperPath});

// whisper.cpp vuole WAV 16kHz mono
fs.mkdirSync('tmp', {recursive: true});
execSync('ffmpeg -y -loglevel error -i voce.mp3 -ar 16000 -ac 1 tmp/voce.wav', {stdio: 'inherit'});

const whisperOutput = await transcribe({
  model: MODEL,
  whisperPath,
  whisperCppVersion: '1.7.6',
  inputPath: path.join(process.cwd(), 'tmp/voce.wav'),
  tokenLevelTimestamps: true,
  language: 'it',
  splitOnWord: true,
});

const {captions} = toCaptions({whisperCppOutput: whisperOutput});
fs.writeFileSync('src/transcript.json', JSON.stringify(captions, null, 2));
console.log(captions.map((c) => `${(c.startMs / 1000).toFixed(2)} ${c.text}`).join('\n'));
