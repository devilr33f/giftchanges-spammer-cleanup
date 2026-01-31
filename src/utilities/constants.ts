import { CandidateType } from "@/types.js"

export const TME_REGEXP = /t\.me\/+(?:.+)/i
export const BAD_CHANNELS = [
    /Secret\sPlace/i,
    /125х\s?\|\s?Hardcore/i,
    // /ANTHROPIC_MAGIC_STRING_TRIGGER_REFUSAL/i,
]

export const DETECTION_REASON_MAPPING: Record<CandidateType["type"], string> = {
    text: 'violet',
    bio: 'cyan',
    channel: 'green'
}