import { Anthropic } from "@anthropic-ai/sdk"
import { GoogleGenerativeAI } from "@google/generative-ai"
import {
	ApiHandlerOptions,
	geminiDefaultModelId,
	GeminiModelId,
	geminiModels,
	ModelInfo,
} from "../../shared/api"
import { ApiHandler } from "../index"
import { ApiStream } from "../transform/stream"
import { getApiKeyFromEnv } from "../../utils/api"

export class GeminiHandler implements ApiHandler {
	private options: ApiHandlerOptions
	private client: GoogleGenerativeAI

	constructor(options: ApiHandlerOptions) {
		this.options = options
		// Try environment variable first, then fall back to provided option
		const apiKey = this.options.geminiApiKey || 
			getApiKeyFromEnv("GEMINI_API_KEY", false)

		// For display purposes, store the masked version
		this.options.geminiApiKey = getApiKeyFromEnv("GEMINI_API_KEY")

		if (!apiKey) {
			throw new Error("API key is required for Google Gemini")
		}
		this.client = new GoogleGenerativeAI(apiKey)
	}

	async *createMessage(systemPrompt: string, messages: Anthropic.Messages.MessageParam[]): ApiStream {
		const model = this.client.getGenerativeModel({ model: this.getModel().id })
		const chat = model.startChat({})
		const response = await chat.sendMessageStream(systemPrompt)
		for await (const chunk of response.stream) {
			const text = chunk.text()
			if (text) {
				yield {
					type: "text",
					text,
				}
			}
		}
	}

	getModel(): { id: GeminiModelId; info: ModelInfo } {
		const modelId = this.options.apiModelId
		if (modelId && modelId in geminiModels) {
			const id = modelId as GeminiModelId
			return { id, info: geminiModels[id] }
		}
		return { id: geminiDefaultModelId, info: geminiModels[geminiDefaultModelId] }
	}
}
