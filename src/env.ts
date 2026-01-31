import { existsSync } from 'node:fs'
import { loadEnvFile } from 'node:process'
import env from 'env-var'

if (existsSync('.env'))
  loadEnvFile('.env')

export default {
  mode: env.get('NODE_ENV').default('production').asString(),
  redisUrl: env.get('REDIS_URL').required().asString(),
  telegram: {
    apiId: env.get('TELEGRAM_API_ID').required().asIntPositive(),
    apiHash: env.get('TELEGRAM_API_HASH').required().asString(),
    deviceModel: env.get('TELEGRAM_DEVICE_MODEL').required().asString(),
    systemVersion: env.get('TELEGRAM_SYSTEM_VERSION').required().asString(),
    langCode: env.get('TELEGRAM_LANG_CODE').default('en').asString(),
    systemLangCode: env.get('TELEGRAM_SYSTEM_LANG_CODE').default('en-US').asString(),
    langPack: env.get('TELEGRAM_LANG_PACK').default('tdesktop').asString(),
  },
  allowedChatIds: env.get('ALLOWED_CHAT_IDS').default('').asArray(',').map((x) => Number(x))
}
