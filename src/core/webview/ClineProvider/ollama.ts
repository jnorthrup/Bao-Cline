import * as vscode from "vscode";
import { OllamaClient } from "../../services/ollama/OllamaClient";

export async function handleOllamaMessage(message: any, context: vscode.ExtensionContext, outputChannel: vscode.OutputChannel): Promise<void> {
  const ollamaClient = new OllamaClient(context);

  switch (message.command) {
    case "getOllamaModels":
      const models = await ollamaClient.getModels();
      await postMessageToWebview({ type: "ollamaModels", models });
      break;
    case "getOllamaSettings":
      const settings = await ollamaClient.getSettings();
      await postMessageToWebview({ type: "ollamaSettings", settings });
      break;
    case "updateOllamaSettings":
      await ollamaClient.updateSettings(message.settings);
      break;
    default:
      outputChannel.appendLine(`Unknown Ollama command: ${message.command}`);
  }
}

async function postMessageToWebview(message: any): Promise<void> {
  const webview = vscode.window.activeTextEditor?.document.uri.scheme === "vscode-webview" ? vscode.window.activeTextEditor : undefined;
  if (webview) {
    webview.webview.postMessage(message);
  }
}
