import env from "@/env.js";
import redis from "@/redis.js";
import { CandidateType } from "@/types.js";
import { BAD_CHANNELS, DETECTION_REASON_MAPPING, TME_REGEXP } from "@/utilities/constants.js";
import { Dispatcher, filters, MessageContext } from "@mtcute/dispatcher";

const checkDispatcher = Dispatcher.child()

checkDispatcher.onNewMessage(
    filters.and(
        filters.chatId(env.allowedChatIds), 
        filters.sender('user'),
        (msg: MessageContext) => !!msg.text?.length,
        (msg: MessageContext) => !msg.isOutgoing
    ), async (ctx) => {
        let counter = await redis.get(`counter:${ctx.sender.id}`).then((result) => {
            return result ? parseInt(result) : null
        })

        if (!counter) {
            const history = await ctx.client.searchMessages({
                chatId: ctx.chat,
                fromUser: ctx.sender,
                limit: 10
            })
            counter = history.length

            await redis.set(`counter:${ctx.sender.id}`, history.length.toString(), 'EX', 300)
        }

        if (counter < 10) {
            const user = await ctx.client.getFullUser(ctx.sender).catch(() => null)
            if (!user) {
                console.error('[!] Unable to get full user:', ctx.sender)
                return
            }

            const candidates: CandidateType[] = []

            if (ctx.text && TME_REGEXP.test(ctx.text)) {
                const [channelUrl] = ctx.text.match(TME_REGEXP)!
                const chatPreview = await ctx.client.getChatPreview(`https://${channelUrl}`).catch((err) => {
                    console.warn(`[!] Unable to get chat bio:`, err)
                    return null
                })
                
                if (chatPreview) {
                    candidates.push({
                        type: 'text',
                        name: chatPreview.title
                    })
                }
            }

            if (user.personalChannel) {
                candidates.push({
                    type: 'channel',
                    name: user.personalChannel.title
                })
            }

            if (TME_REGEXP.test(user.bio)) {
                const [channelUrl] = user.bio.match(TME_REGEXP)!
                const chatPreview = await ctx.client.getChatPreview(`https://${channelUrl}`).catch((err) => {
                    console.warn(`[!] Unable to get chat bio:`, err)
                    return null
                })
                if (chatPreview) {
                    candidates.push({
                        type: 'bio',
                        name: chatPreview.title
                    })
                }
            }
            
            const stories = await ctx.client.getPeerStories(ctx.sender)
                .then((r) => r.stories)
                .catch((err) => {
                    console.warn(`[!] Unable to get stories:`, err)
                    return null
                })

            if (stories && stories.length) {
                const tmeUrls = stories.filter((story) => {
                    return story.interactiveElements?.filter((elem) => {
                        return elem.raw._ === 'mediaAreaUrl' && TME_REGEXP.test(elem.raw.url)
                    })
                }).map((story) => {
                    return story.interactiveElements.map((elem) => elem.raw._ === 'mediaAreaUrl' && elem.raw.url)
                }).flat()
                  .filter((a) => a !== false)

                console.log(tmeUrls)
                
                if (tmeUrls.length) {
                    const previews = await Promise.all(tmeUrls.map((url) => ctx.client.getChatPreview(url).catch((r) => { return null })))
                }
            }

            if (candidates.length) {
                console.log(`[~] Found ${candidates.length} candidates for "${user.displayName}" (id: ${user.id})`)

                const matches = candidates.filter((candidate) => BAD_CHANNELS.some((regexp) => regexp.test(candidate.name)))
                if (matches.length) {
                    console.log(`[~] Found ${matches.length} bad matches, banning...`)

                    const detectionsText = matches.map(({ type }) => DETECTION_REASON_MAPPING[type]).join(', ')

                    await ctx.replyText(`/dban 🤖 Bad channel detected (detections: ${detectionsText})`)
                }
            }
        }
    }
)

export default checkDispatcher