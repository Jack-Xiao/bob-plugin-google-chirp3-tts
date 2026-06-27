# Bob Plugin · Google Chirp 3 HD TTS

[Bob](https://bobtranslate.com/) 的语音合成（TTS）插件，使用 Google Cloud Text-to-Speech 最新的 **Chirp 3 HD** 语音模型——基于 LLM 的新一代音色，比内置的 Standard/WaveNet/Neural2/Studio 更自然，且 **价格仅为 Studio 的约 1/5**（$30 vs $160 / 百万字符）。

> A Bob TTS plugin powered by Google Cloud **Chirp 3 HD** voices. English & Chinese, API-key auth, no service account needed.

## ✨ 特性

- **Chirp 3 HD 全部 30 个音色**，每月前 100 万字符免费
- **中英双语**：读英文走 `en-US`，读中文自动走 `cmn-CN`，同一音色人格通用
- **仅需 API Key**，无需 Service Account / JWT
- **本地字符上限**（单次 3000 字），防止误点长文产生费用
- **音色快速试听**：文本开头写 `@音色名` 即可临时切换音色，配合 Bob 原生 🔊 朗读做 A/B 对比

## 📦 安装

1. 到 [Releases](https://github.com/Jack-Xiao/bob-plugin-google-chirp3-tts/releases/latest) 下载最新的 `.bobplugin`
2. 双击安装到 Bob

## 🔑 获取 Google API Key

1. 打开 [Google Cloud Console](https://console.cloud.google.com/)，新建或选择一个项目
2. 启用 **Cloud Text-to-Speech API**
3. 「凭据」→「创建凭据」→「API 密钥」，复制
4. 建议点「限制密钥」，仅允许访问 Cloud Text-to-Speech API

> 详细图文可参考 Bob 官方文档：[Google 语音合成](https://bobtranslate.com/service/tts/google.html)（密钥申请流程通用，仅音色不同）。

## ⚙️ 配置

| 选项 | 说明 |
| --- | --- |
| **Google API Key** | 上一步获取的密钥 |
| **Voice 音色** | 跨语言通用人格，默认 `Aoede`（女声·自然） |
| **Speaking Rate 语速** | 0.25–2.0，低于 1.0 变慢，适合听力精听 |

## 🎧 音色试听技巧

Bob 插件设置里无法放「试听」按钮（这是 Bob 第一方服务的专属 UI，插件 API 不支持自定义按钮与音频播放）。本插件用一个轻量替代方案：

在 Bob 主窗口的文本开头写 `@音色名`，本次合成就用该音色，前缀会被自动去掉、不会被读出来：

```
@Aoede Hello, this is a quick voice test.
@Kore  Hello, this is a quick voice test.
@Sulafat 你好，这是一段中文测试。
```

逐个点 🔊 即可秒级对比，选定后填进设置当默认。

### 推荐音色（女声优先）

| 音色 | 特点 |
| --- | --- |
| **Aoede** | 自然轻快（默认推荐） |
| **Kore** | 清晰沉稳，偏专业播报 |
| Sulafat | 温暖 |
| Leda | 年轻 |
| Zephyr | 明亮 |

完整 30 个音色见插件设置下拉框。

## 💰 计费与防超支

- Chirp 3 HD：每月前 **100 万字符免费**，超出 **$30 / 百万字符**
- 插件已内置单次 3000 字符上限；建议同时在 Google Cloud Console 设置 **预算提醒**
- 参考用量：1 万字符 ≈ $0.3，10 万 ≈ $3（均在免费额度内）

## 🛠 开发 / 打包

插件核心仅两个文件：`info.json`（元信息与选项）、`main.js`（合成逻辑）。

```bash
zip -j google-chirp3-tts.bobplugin info.json main.js
```

仓库还附带 `generate-previews.js`：用你的 API Key 一次性把全部音色合成成一个 HTML 试听台（`node generate-previews.js <API_KEY>`）。

## 🙏 致谢

结构参考自 [poyih/bob-plugin-openai-tts](https://github.com/poyih/bob-plugin-openai-tts)。

## License

[MIT](LICENSE)
