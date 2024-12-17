import { Anthropic } from "@anthropic-ai/sdk"
import OpenAI from "openai"
import {
	ApiHandlerOptions,
	ModelInfo,
	openRouterDefaultModelId,
	openRouterDefaultModelInfo,
} from "../../shared/api"
import { ApiHandler } from "../index"
import { convertToOpenAiMessages } from "../transform/openai-format"
import { ApiStream, ApiStreamUsageChunk } from "../transform/stream"
import { getApiKeyFromEnv } from "../../utils/api"

export class OpenRouterHandler implements ApiHandler {
	private options: ApiHandlerOptions
	private client: OpenAI

	constructor(options: ApiHandlerOptions) {
		this.options = options
		// Try environment variable first, then fall back to provided option
		const apiKey = this.options.openRouterApiKey || getApiKeyFromEnv("OPENROUTER_API_KEY", false)

		// For display purposes, store the masked version
		this.options.openRouterApiKey = getApiKeyFromEnv("OPENROUTER_API_KEY")

		this.client = new OpenAI({
			baseURL: "https://openrouter.ai/api/v1",
			apiKey: apiKey,
			defaultHeaders: {
				"HTTP-Referer": "https://github.com/RooVetGit/Roo-Cline",
				"X-Title": "Roo-Cline",
			},
		})
	}

	async *createMessage(systemPrompt: string, messages: Anthropic.Messages.MessageParam[]): ApiStream {
		const openAiMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
			{ role: "system", content: systemPrompt },
			...convertToOpenAiMessages(messages),
		]
		try {
			const stream = await this.client.chat.completions.create({
				model: this.options.openRouterModelId ?? openRouterDefaultModelId,
				messages: openAiMessages,
				temperature: 0,
				stream: true,
			})
			let totalInputTokens = 0
			let totalOutputTokens = 0
			let totalCost = 0
			let fullResponseText = ""

			for await (const chunk of stream) {
				// Safely handle chunks with optional chaining
				const choices = chunk.choices ?? []
				const firstChoice = choices[0] ?? {}
				const delta = firstChoice.delta ?? {}

				if (delta.content) {
					const content = delta.content
					fullResponseText += content
					yield {
						type: "text",
						text: content,
					}
				}

				// Safely handle usage information
				if (chunk.usage) {
					const promptTokens = chunk.usage.prompt_tokens ?? 0
					const completionTokens = chunk.usage.completion_tokens ?? 0
					const modelInfo = this.getModel().info

					totalInputTokens += promptTokens
					totalOutputTokens += completionTokens
					totalCost += (promptTokens * (modelInfo.inputPrice ?? 0)) + 
								 (completionTokens * (modelInfo.outputPrice ?? 0))
				}
			}

			// Yield the usage chunk after the stream is complete
			yield {
				type: "usage",
				inputTokens: totalInputTokens,
				outputTokens: totalOutputTokens,
				totalCost: totalCost,
				fullResponseText: fullResponseText,
			}
		} catch (error: any) {
			if (error?.code) {
				console.error(`OpenRouter API Error: ${error?.code} - ${error?.message}`)
				throw new Error(`OpenRouter API Error ${error?.code}: ${error?.message}`)
			}
			throw error
		}
	}

	getModel(): { id: string; info: ModelInfo } {
		return {
			id: this.options.openRouterModelId ?? openRouterDefaultModelId,
			info: this.options.openRouterModelInfo ?? openRouterDefaultModelInfo,
		}
	}
}
