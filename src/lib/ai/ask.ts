import Anthropic from '@anthropic-ai/sdk'
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod'
import type * as z from 'zod'
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
  const stream = await getClient().messages.create({
    model: MODEL,
    max_tokens: opts.maxTokens,
    thinking: { type: 'adaptive' },
    system: opts.system,
    messages: [{ role: 'user', content: opts.user }],
    output_config: { format: zodOutputFormat(opts.schema) },
    stream: true,
  })

  let text = ''
  let stopReason: string | null = null
  let inputTokens = 0
  let outputTokens = 0

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

  // Recorded before any throw: a call that failed still cost money, and a
  // ledger that only counts successes understates what a book costs.
  record(opts.label, MODEL, {
    input_tokens: inputTokens,
    output_tokens: outputTokens,
  })

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
