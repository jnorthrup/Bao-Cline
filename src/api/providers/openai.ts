import { Anthropic } from "@anthropic-ai/sdk"
import OpenAI, { AzureOpenAI } from "openai"
import {
	ApiHandlerOptions,
	azureOpenAiDefaultApiVersion,
	ModelInfo,
	openAiModelInfoSaneDefaults,
} from "../../shared/api"
import { ApiHandler } from "../index"
import { convertToOpenAiMessages } from "../transform/openai-format"
import { ApiStream } from "../transform/stream"
import { getApiKeyFromEnv } from "../../utils/api"

export class OpenAiHandler implements ApiHandler {
	private options: ApiHandlerOptions
	private client: OpenAI

	constructor(options: ApiHandlerOptions) {
		this.options = options
		// Try environment variable first, then fall back to provided option
		const apiKey = this.options.openAiApiKey || 
			getApiKeyFromEnv("OPENAI_API_KEY", false)
		
		// For display purposes, store the masked version
		this.options.openAiApiKey = getApiKeyFromEnv("OPENAI_API_KEY")

		// Azure API shape slightly differs from the core API shape: https://github.com/openai/openai-node?tab=readme-ov-file#microsoft-azure-openai
		const urlHost = new URL(this.options.openAiBaseUrl ?? "").host;
		if (urlHost === "azure.com" || urlHost.endsWith(".azure.com")) {
			this.client = new AzureOpenAI({
				baseURL: this.options.openAiBaseUrl,
				apiKey: apiKey,
				apiVersion: this.options.azureApiVersion || azureOpenAiDefaultApiVersion,
			})
		} else {
			this.client = new OpenAI({
				baseURL: this.options.openAiBaseUrl,
				apiKey: apiKey,
			})
		}
	}

	// Include stream_options for OpenAI Compatible providers if the checkbox is checked
	async *createMessage(systemPrompt: string, messages: Anthropic.Messages.MessageParam[]): ApiStream {
		const openAiMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
			{ role: "system", content: systemPrompt },
			...convertToOpenAiMessages(messages),
		]
		const requestOptions: OpenAI.Chat.ChatCompletionCreateParams = {
			model: this.options.openAiModelId ?? "",
			messages: openAiMessages,
			temperature: 0,
			stream: true,
		}

		if (this.options.includeStreamOptions ?? true) {
			requestOptions.stream_options = { include_usage: true }
		}

		const stream = await this.client.chat.completions.create(requestOptions)
		for await (const chunk of stream) {
			const delta = chunk.choices[0]?.delta
			if (delta?.content) {
				yield {
					type: "text",
					text: delta.content,
				}
			}
			if (chunk.usage) {
				yield {
					type: "usage",
					inputTokens: chunk.usage.prompt_tokens || 0,
					outputTokens: chunk.usage.completion_tokens || 0,
				}
			}
		}
	}

	getModel(): { id: string; info: ModelInfo } {
		return {
			id: this.options.openAiModelId ?? "",
			info: openAiModelInfoSaneDefaults,
		}
	}
}
