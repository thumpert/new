import Anthropic, { APIError } from '@anthropic-ai/sdk'
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod'
import type * as z from 'zod'
import { ProviderError, describeError, retryAfter } from '../errors'
import { record } from './usage'

export const MODEL = 'claude-opus-5'

let client: Anthropic | null = null

function getClient(): Anthropic {
  if (!client) client = new Anthropic()
  return client
}

export function hasAnthropicKey(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN)
}

/**
 * One request, one validated object.
 *
 * Deliberately not `messages.parse`. That helper throws the moment the JSON
 * does not parse, and it throws from inside the SDK — so `stop_reason`, the
 * one field that explains *why*, is gone before the error reaches us. What
 * the customer saw was "Unterminated string in JSON at position 6142", which
 * sends you hunting for a parser bug when the model had simply run out of
 * room mid-sentence.
 *
 * Streaming is not a preference here: the SDK refuses a non-streaming request
 * whose max_tokens could outrun the 10-minute HTTP timeout, and these
 * ceilings are past that line. `output_config.format` still constrains the
 * model to the schema, so the only way the text can be invalid JSON is if it
 * was cut short.
 */
export async function askForJson<T extends z.ZodType>(opts: {
  /** Named in the error the customer sees. */
  what: string
  /** Named in the cost ledger. */
  label: string
  schema: T
  maxTokens: number
  system: string
  user: string
}): Promise<z.infer<T>> {
  const startedAt = Date.now()
  let text = ''
  let stopReason: string | null = null
  let inputTokens = 0
  let outputTokens = 0

  try {
    const stream = await getClient().messages.create({
      model: MODEL,
      max_tokens: opts.maxTokens,
      thinking: { type: 'adaptive' },
      system: opts.system,
      messages: [{ role: 'user', content: opts.user }],
      output_config: { format: zodOutputFormat(opts.schema) },
      stream: true,
    })

    for await (const event of stream) {
      if (event.type === 'message_start') {
        inputTokens = event.message.usage.input_tokens ?? 0
      } else if (
        event.type === 'content_block_delta' &&
        event.delta.type === 'text_delta'
      ) {
        text += event.delta.text
      } else if (event.type === 'message_delta') {
        stopReason = event.delta.stop_reason ?? stopReason
        outputTokens = event.usage.output_tokens ?? outputTokens
      }
    }
  } catch (err) {
    throw asProviderError(err, opts.what)
  } finally {
    // In `finally` because a call that failed still cost money, and a ledger
    // that only counts successes understates what a book costs. A request
    // refused before it began records two zeroes, which is the truth.
    record(
      opts.label,
      MODEL,
      { input_tokens: inputTokens, output_tokens: outputTokens },
      Date.now() - startedAt,
    )
  }

  if (stopReason === 'max_tokens') {
    throw new Error(
      `Ran out of room while writing the ${opts.what}: the answer hit the ` +
        `${opts.maxTokens}-token ceiling and was cut off. Raise maxTokens ` +
        `for this call.`,
    )
  }

  if (stopReason === 'refusal') {
    throw new Error(`The model declined to write the ${opts.what}.`)
  }

  if (!text.trim()) {
    throw new Error(`The model returned nothing for the ${opts.what}.`)
  }

  let json: unknown
  try {
    json = JSON.parse(text)
  } catch {
    throw new Error(
      `The ${opts.what} came back as invalid JSON (stop_reason: ` +
        `${stopReason}). This normally means the answer was truncated.`,
    )
  }

  const result = opts.schema.safeParse(json)
  if (!result.success) {
    throw new Error(
      `The ${opts.what} did not match the expected shape: ${result.error.message}`,
    )
  }
  return result.data
}

/**
 * The SDK's failure, rewritten as one of ours.
 *
 * Two things were wrong with letting it through as it came.
 *
 * The first is what the customer read. `APIError.message` is the status
 * followed by the response body, verbatim, so an account that had run out of
 * credit put this on the screen of somebody ordering a colouring book:
 *
 *   400 {"type":"error","error":{"type":"invalid_request_error","message":
 *   "Your credit balance is too low to access the Anthropic API. ..."}}
 *
 * The sentence inside it is perfectly clear and the JSON around it is not, so
 * the sentence is what we keep.
 *
 * The second is that the status arrived only as prose. The drawings already
 * learned what that costs — `worthAskingAgain` reads the number off the error
 * object, and until now nothing on the writing side put one there, so every
 * failure of a story looked equally like weather. A 429 or a 529 is worth
 * another attempt; a 400 for billing and a 401 for a bad key will answer the
 * same way however many times they are asked.
 *
 * No retry loop here, though. The SDK already asks again twice on the statuses
 * that deserve it, waiting as long as the header told it to.
 */
function asProviderError(err: unknown, what: string): ProviderError {
  if (err instanceof APIError) {
    return new ProviderError(`Could not write the ${what}: ${reasonFrom(err)}`, {
      // Undefined on a connection error the request never survived, which
      // `worthAskingAgain` correctly reads as worth another go.
      status: err.status,
      retryAfterMs: retryAfter(err.headers),
      cause: err,
    })
  }

  // Not from the SDK at all: a stream that died mid-sentence, a timeout, a
  // socket. Nothing answered, so nothing says not to ask again.
  return new ProviderError(`Could not write the ${what}: ${describeError(err)}`, {
    cause: err,
  })
}

/** The API's own sentence, or the SDK's line when the body carried none. */
function reasonFrom(err: APIError): string {
  const body = err.error as { error?: { message?: unknown } } | undefined
  const message = body?.error?.message
  return typeof message === 'string' && message.trim() ? message : err.message
}
