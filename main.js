// Google Cloud Text-to-Speech — Chirp 3 HD 语音合成插件 (Bob)
// 鉴权：API Key（?key=），无需 Service Account / JWT。
// 文档：https://cloud.google.com/text-to-speech/docs/chirp3-hd
// 支持英文(en-US) 与中文(cmn-CN)，按文本语言自动选择 locale，音色为跨语言通用人格。
// 试听技巧：在 Bob 主窗口里，文本开头写「@音色名」即可本次临时切换音色，
//          配合 Bob 原生的 🔊 朗读按钮可快速 A/B 对比，例如：@Kore Hello world

var ENDPOINT = 'https://texttospeech.googleapis.com/v1/text:synthesize';

// Bob 的语言代码 → Google locale。Chirp 3 HD 同一音色人格跨 locale 通用。
var LANG_MAP = {
    'en': 'en-US',
    'zh-Hans': 'cmn-CN',
    'zh-Hant': 'cmn-CN'
};
var DEFAULT_LOCALE = 'en-US';
var DEFAULT_PERSONA = 'Aoede';

// 本地保险：单次最多合成多少字符，超出直接拒绝，避免误点长文产生费用。
var MAX_TEXT_LENGTH = 3000;

function supportLanguages() {
    return ['en', 'zh-Hans', 'zh-Hant'];
}

function readOption(name) {
    var value = $option[name];
    return value == null ? '' : String(value).trim();
}

function getApiKey() {
    return readOption('apiKey');
}

// 兼容旧版本里存的完整音色名（如 en-US-Chirp3-HD-Charon），统一取出人格短名。
function getPersona() {
    var v = readOption('voice');
    if (!v) return DEFAULT_PERSONA;
    var m = v.match(/Chirp3-HD-([A-Za-z]+)/i);
    if (m) return normalizePersona(m[1]);
    return normalizePersona(v);
}

function normalizePersona(name) {
    var key = String(name).toLowerCase();
    return VOICE_LOOKUP[key] || DEFAULT_PERSONA;
}

function localeForLang(lang) {
    return LANG_MAP[lang] || DEFAULT_LOCALE;
}

function getSpeakingRate() {
    var rate = parseFloat(readOption('speakingRate'));
    if (isNaN(rate) || rate <= 0) {
        return 1.0;
    }
    // Chirp 3 HD 支持范围 0.25–2.0，越界做个保护性收口。
    if (rate < 0.25) return 0.25;
    if (rate > 2.0) return 2.0;
    return rate;
}

function buildUrl() {
    return ENDPOINT + '?key=' + encodeURIComponent(getApiKey());
}

function buildBody(text, locale, persona) {
    return {
        input: { text: text },
        voice: { languageCode: locale, name: locale + '-Chirp3-HD-' + persona },
        audioConfig: { audioEncoding: 'MP3', speakingRate: getSpeakingRate() }
    };
}

// 全部 Chirp 3 HD 音色人格短名，用于解析文本前缀 @音色名 临时切换音色试听。
var VOICE_NAMES = [
    'Achernar', 'Achird', 'Algenib', 'Algieba', 'Alnilam', 'Aoede', 'Autonoe',
    'Callirrhoe', 'Charon', 'Despina', 'Enceladus', 'Erinome', 'Fenrir', 'Gacrux',
    'Iapetus', 'Kore', 'Laomedeia', 'Leda', 'Orus', 'Puck', 'Pulcherrima',
    'Rasalgethi', 'Sadachbia', 'Sadaltager', 'Schedar', 'Sulafat', 'Umbriel',
    'Vindemiatrix', 'Zephyr', 'Zubenelgenubi'
];

var VOICE_LOOKUP = (function() {
    var m = {};
    for (var i = 0; i < VOICE_NAMES.length; i++) {
        m[VOICE_NAMES[i].toLowerCase()] = VOICE_NAMES[i];
    }
    return m;
})();

// 试听技巧：文本以「@音色名」开头时，本次合成临时使用该音色，并把前缀从文本中去掉。
// 仅当 @ 后面正好是已知音色名才生效，普通以 @ 开头的文本不受影响。
function resolveVoiceOverride(text) {
    var m = text.match(/^\s*@([A-Za-z]+)[\s,:，、]*/);
    if (m) {
        var hit = VOICE_LOOKUP[m[1].toLowerCase()];
        if (hit) {
            return { persona: hit, text: text.slice(m[0].length) };
        }
    }
    return { persona: null, text: text };
}

function validateOptions() {
    if (!getApiKey()) {
        return { type: 'param', message: '请先在插件设置中填写 Google API Key。' };
    }
    return null;
}

function pluginValidate(completion) {
    var error = validateOptions();
    if (error) {
        completion({ error: error });
        return;
    }

    $http.request({
        method: 'POST',
        url: buildUrl(),
        header: { 'Content-Type': 'application/json' },
        body: buildBody('hi', DEFAULT_LOCALE, getPersona()),
        timeout: 15,
        handler: function(resp) {
            if (resp.error) {
                completion({ error: toServiceError(resp.error) });
                return;
            }
            if (resp.response && resp.response.statusCode >= 400) {
                completion({ error: parseHttpError(resp) });
                return;
            }
            completion({ result: true });
        }
    });
}

function tts(query, completion) {
    var validationError = validateOptions();
    if (validationError) {
        completion({ error: validationError });
        return;
    }

    if (!query || !query.text || !String(query.text).trim()) {
        completion({ error: { type: 'param', message: '待合成文本不能为空。' } });
        return;
    }

    var rawText = String(query.text).trim();

    // 解析「@音色名」前缀：命中已知音色则本次临时切换，并去掉前缀。
    var override = resolveVoiceOverride(rawText);
    var persona = override.persona || getPersona();
    var text = override.persona ? override.text.trim() : rawText;

    if (override.persona && !text) {
        completion({
            error: {
                type: 'param',
                message: '请在「@音色名」后面输入要试听的文本，例如：@Kore Hello, this is a test.'
            }
        });
        return;
    }

    if (text.length > MAX_TEXT_LENGTH) {
        completion({
            error: {
                type: 'param',
                message: '文本超出 ' + MAX_TEXT_LENGTH + ' 字符限制（当前 ' + text.length +
                    ' 字符），已阻止请求以避免产生费用。'
            }
        });
        return;
    }

    var locale = localeForLang(query.lang);

    $http.request({
        method: 'POST',
        url: buildUrl(),
        header: { 'Content-Type': 'application/json' },
        body: buildBody(text, locale, persona),
        timeout: 60,
        handler: function(resp) {
            if (resp.error) {
                completion({ error: toServiceError(resp.error) });
                return;
            }

            if (resp.response && resp.response.statusCode >= 400) {
                completion({ error: parseHttpError(resp) });
                return;
            }

            // Google 直接返回 base64 音频（与 OpenAI 不同，无需对 rawData 再转码）。
            var audioBase64 = resp.data && resp.data.audioContent;
            if (!audioBase64) {
                completion({ error: { type: 'api', message: 'TTS 服务没有返回音频数据。' } });
                return;
            }

            completion({
                result: {
                    type: 'base64',
                    value: audioBase64,
                    raw: {
                        voice: locale + '-Chirp3-HD-' + persona,
                        languageCode: locale,
                        format: 'mp3'
                    }
                }
            });
        }
    });
}

function parseHttpError(resp) {
    var statusCode = resp.response ? resp.response.statusCode : 0;
    var apiMessage = '';

    try {
        var body = resp.data;
        if (body && body.error && body.error.message) {
            apiMessage = body.error.message;
        }
    } catch (e) {}

    var context = '';
    if (statusCode === 400) {
        context = '请求参数有误（请检查音色名是否支持当前语言）';
    } else if (statusCode === 401 || statusCode === 403) {
        context = 'API Key 无效/未授权，或项目未启用 Cloud Text-to-Speech API';
    } else if (statusCode === 429) {
        context = '请求过于频繁或已超出配额';
    } else if (statusCode >= 500) {
        context = 'Google TTS 服务暂时不可用，请稍后再试';
    }

    var message = 'HTTP ' + statusCode;
    if (context) message += ' - ' + context;
    if (apiMessage) message += '\n' + apiMessage;

    return { type: 'api', message: message };
}

function toServiceError(error) {
    var message = '请求失败';
    if (error) {
        if (typeof error === 'string') {
            message = error;
        } else if (error.localizedDescription) {
            message = error.localizedDescription;
        } else if (error.message) {
            message = error.message;
        }
    }
    return { type: 'network', message: message };
}
