import * as vscode from "vscode";

export async function handleSecretsMessage(message: any, context: vscode.ExtensionContext, outputChannel: vscode.OutputChannel): Promise<void> {
  switch (message.command) {
    case "storeSecret":
      await storeSecret(message.key, message.value, context);
      break;
    case "getSecret":
      const secretValue = await getSecret(message.key, context);
      await postMessageToWebview({ type: "secret", key: message.key, value: secretValue });
      break;
    default:
      outputChannel.appendLine(`Unknown secrets command: ${message.command}`);
  }
}

async function storeSecret(key: string, value: string, context: vscode.ExtensionContext): Promise<void> {
  if (value) {
    await context.secrets.store(key, value);
  } else {
    await context.secrets.delete(key);
  }
}

async function getSecret(key: string, context: vscode.ExtensionContext): Promise<string | undefined> {
  return await context.secrets.get(key);
}

async function postMessageToWebview(message: any): Promise<void> {
  const webview = vscode.window.activeTextEditor?.document.uri.scheme === "vscode-webview" ? vscode.window.activeTextEditor : undefined;
  if (webview) {
    webview.webview.postMessage(message);
  }
}
