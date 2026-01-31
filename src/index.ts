import { TelegramClient } from "@mtcute/node";
import env from "./env.js";
import { join } from "node:path";
import { cwd } from "node:process";
import { fetchLatestTDesktopRelease } from "./utilities/tdesktop.js";
import { jsonToTlJson } from "@mtcute/node/utils.js";
import { Dispatcher } from "@mtcute/dispatcher";
import encodeQR from "qr";
import checkDispatcher from "./dispatchers/check.js";

const tg = new TelegramClient({
    apiId: env.telegram.apiId,
    apiHash: env.telegram.apiHash,
    storage: join(cwd(), 'bot-data', 'session'),
    initConnectionOptions: {
        _: 'initConnection',
        appVersion: await fetchLatestTDesktopRelease(),
        deviceModel: env.telegram.deviceModel,
        systemVersion: env.telegram.systemVersion,
        langCode: env.telegram.langCode,
        langPack: env.telegram.langPack,
        systemLangCode: env.telegram.systemLangCode,
        params: jsonToTlJson({ tz_offset: 0 })
    }
})
const dp = Dispatcher.for(tg)
dp.extend(checkDispatcher)

const me = await tg.start({
    qrCodeHandler: (url) => console.log(encodeQR(url, 'ascii')),
    password: () => tg.input('Password > ')
})
console.log(`Logged in as "${me.displayName}"`)