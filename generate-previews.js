#!/usr/bin/env node
// Chirp 3 HD 音色试听台生成器
// 用法：  node generate-previews.js <YOUR_API_KEY>
//   或：  GOOGLE_TTS_API_KEY=xxx node generate-previews.js
// 产出：  voice-preview.html （单文件，内嵌全部音色音频，浏览器打开即可逐个试听）

const https = require('https');
const fs = require('fs');
const path = require('path');

// ===== 可改：试听用的英文句子（换成你想听的内容即可）=====
const SAMPLE_TEXT =
    "Hi, thanks for joining today's call. Before we dive into the quarterly " +
    "numbers, I'd like to quickly walk through the agenda. If you have any " +
    "questions, feel free to jump in at any time. So, let's get started — " +
    "shall we?";

const LANGUAGE_CODE = 'en-US';
const SPEAKING_RATE = 1.0; // 想试听慢速可改成 0.9
// =========================================================

// [显示名, 性别标签, 音色短名]
const VOICES = [
    ['Charon', '男声', 'Charon'], ['Kore', '女声', 'Kore'],
    ['Aoede', '女声', 'Aoede'], ['Puck', '男声', 'Puck'],
    ['Leda', '女声', 'Leda'], ['Fenrir', '男声', 'Fenrir'],
    ['Zephyr', '女声', 'Zephyr'], ['Orus', '男声', 'Orus'],
    ['Achernar', '', 'Achernar'], ['Achird', '', 'Achird'],
    ['Algenib', '', 'Algenib'], ['Algieba', '', 'Algieba'],
    ['Alnilam', '', 'Alnilam'], ['Autonoe', '', 'Autonoe'],
    ['Callirrhoe', '', 'Callirrhoe'], ['Despina', '', 'Despina'],
    ['Enceladus', '', 'Enceladus'], ['Erinome', '', 'Erinome'],
    ['Gacrux', '', 'Gacrux'], ['Iapetus', '', 'Iapetus'],
    ['Laomedeia', '', 'Laomedeia'], ['Pulcherrima', '', 'Pulcherrima'],
    ['Rasalgethi', '', 'Rasalgethi'], ['Sadachbia', '', 'Sadachbia'],
    ['Sadaltager', '', 'Sadaltager'], ['Schedar', '', 'Schedar'],
    ['Sulafat', '', 'Sulafat'], ['Umbriel', '', 'Umbriel'],
    ['Vindemiatrix', '', 'Vindemiatrix'], ['Zubenelgenubi', '', 'Zubenelgenubi'],
];

const apiKey = process.argv[2] || process.env.GOOGLE_TTS_API_KEY;
if (!apiKey) {
    console.error('缺少 API Key。用法：node generate-previews.js <YOUR_API_KEY>');
    process.exit(1);
}

function synthesize(voiceShortName) {
    const fullName = `${LANGUAGE_CODE}-Chirp3-HD-${voiceShortName}`;
    const payload = JSON.stringify({
        input: { text: SAMPLE_TEXT },
        voice: { languageCode: LANGUAGE_CODE, name: fullName },
        audioConfig: { audioEncoding: 'MP3', speakingRate: SPEAKING_RATE },
    });

    const options = {
        hostname: 'texttospeech.googleapis.com',
        path: `/v1/text:synthesize?key=${encodeURIComponent(apiKey)}`,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(payload),
        },
    };

    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (c) => (data += c));
            res.on('end', () => {
                if (res.statusCode >= 400) {
                    let msg = `HTTP ${res.statusCode}`;
                    try {
                        const j = JSON.parse(data);
                        if (j.error && j.error.message) msg += ` - ${j.error.message}`;
                    } catch (e) {}
                    return reject(new Error(msg));
                }
                try {
                    const j = JSON.parse(data);
                    if (!j.audioContent) return reject(new Error('无 audioContent'));
                    resolve(j.audioContent); // 已是 base64
                } catch (e) {
                    reject(e);
                }
            });
        });
        req.on('error', reject);
        req.write(payload);
        req.end();
    });
}

(async () => {
    const results = [];
    let totalChars = 0;
    for (let i = 0; i < VOICES.length; i++) {
        const [label, gender, shortName] = VOICES[i];
        process.stdout.write(`[${i + 1}/${VOICES.length}] 合成 ${shortName} ... `);
        try {
            const b64 = await synthesize(shortName);
            totalChars += SAMPLE_TEXT.length;
            results.push({ label, gender, shortName, b64 });
            console.log('OK');
        } catch (err) {
            console.log('失败: ' + err.message);
            results.push({ label, gender, shortName, b64: null, error: err.message });
        }
    }

    const cards = results
        .map((r) => {
            const fullId = `${LANGUAGE_CODE}-Chirp3-HD-${r.shortName}`;
            const tag = r.gender ? `<span class="tag">${r.gender}</span>` : '';
            const player = r.b64
                ? `<audio controls preload="none" src="data:audio/mp3;base64,${r.b64}"></audio>`
                : `<span class="err">合成失败：${r.error || '未知错误'}</span>`;
            return `<div class="card">
        <div class="head"><strong>${r.label}</strong>${tag}</div>
        ${player}
        <code onclick="navigator.clipboard.writeText('${fullId}')" title="点击复制">${fullId}</code>
      </div>`;
        })
        .join('\n');

    const html = `<!doctype html><html lang="zh"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Chirp 3 HD 音色试听台</title>
<style>
  body{font-family:-apple-system,system-ui,sans-serif;margin:0;padding:24px;background:#f5f5f7;color:#1d1d1f}
  h1{font-size:20px} .sub{color:#666;font-size:13px;margin-bottom:20px}
  .sub code{background:#e8e8ed;padding:2px 6px;border-radius:4px}
  .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:14px}
  .card{background:#fff;border-radius:12px;padding:14px;box-shadow:0 1px 3px rgba(0,0,0,.08)}
  .head{display:flex;align-items:center;gap:8px;margin-bottom:8px}
  .tag{font-size:11px;background:#eef;color:#446;padding:2px 8px;border-radius:10px}
  audio{width:100%}
  code{display:inline-block;margin-top:8px;font-size:12px;background:#f0f0f2;padding:4px 8px;border-radius:6px;cursor:pointer}
  code:hover{background:#e0e0e6}
  .err{color:#c00;font-size:13px}
</style></head><body>
<h1>Chirp 3 HD 音色试听台</h1>
<div class="sub">试听句子：<code>${SAMPLE_TEXT.replace(/</g, '&lt;')}</code><br>
选好后，点音色 ID 复制，填进 Bob 插件设置的 Voice（或自定义音色框）即可。</div>
<div class="grid">
${cards}
</div></body></html>`;

    const outPath = path.join(__dirname, 'voice-preview.html');
    fs.writeFileSync(outPath, html);
    const ok = results.filter((r) => r.b64).length;
    console.log(`\n完成：${ok}/${VOICES.length} 个音色，合计约 ${totalChars} 字符（免费额度内）。`);
    console.log(`已生成：${outPath}`);
    console.log('用浏览器打开它即可逐个试听。');
})();
