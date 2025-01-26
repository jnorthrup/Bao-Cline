import * as vscode from "vscode";
import { OpenRouterHandler } from "../../api/providers/openrouter";
import { ApiConfiguration } from "../../shared/api";

export async function handleOpenRouterMessage(message: any, context: vscode.ExtensionContext, outputChannel: vscode.OutputChannel): Promise<void> {
  const apiConfig: ApiConfiguration = {
    apiProvider: "openrouter",
    openRouterApiKey: message.apiKey,
    openRouterModelId: message.modelId,
    openRouterModelInfo: message.modelInfo,
  };

  const openRouterHandler = new OpenRouterHandler(apiConfig);

  switch (message.command) {
    case "getOpenRouterModels":
      const models = await openRouterHandler.getModels();
      await postMessageToWebview({ type: "openRouterModels", models });
      break;
    case "createOpenRouterMessage":
      const response = await openRouterHandler.createMessage(message.systemPrompt, message.messages);
      await postMessageToWebview({ type: "openRouterMessageResponse", response });
      break;
    default:
      outputChannel.appendLine(`Unknown OpenRouter command: ${message.command}`);
  }
}

async function postMessageToWebview(message: any): Promise<void> {
  const webview = vscode.window.activeTextEditor?.document.uri.scheme === "vscode-webview" ? vscode.window.activeTextEditor : undefined;
  if (webview) {
    webview.webview.postMessage(message);
  }
}
