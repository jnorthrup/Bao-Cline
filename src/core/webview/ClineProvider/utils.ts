import * as vscode from "vscode";

export function getNonce(): string {
  let text = "";
  const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

export function getUri(webview: vscode.Webview, extensionUri: vscode.Uri, pathList: string[]): vscode.Uri {
  return webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, ...pathList));
}

export async function handleWebviewMessage(message: any, context: vscode.ExtensionContext, outputChannel: vscode.OutputChannel): Promise<void> {
  switch (message.command) {
    case "alert":
      vscode.window.showErrorMessage(message.text);
      break;
    case "info":
      vscode.window.showInformationMessage(message.text);
      break;
    case "warn":
      vscode.window.showWarningMessage(message.text);
      break;
    default:
      outputChannel.appendLine(`Unknown command: ${message.command}`);
  }
}

export async function updateGlobalState(key: string, value: any, context: vscode.ExtensionContext): Promise<void> {
  await context.globalState.update(key, value);
}

export async function getGlobalState(key: string, context: vscode.ExtensionContext): Promise<any> {
  return context.globalState.get(key);
}

export async function updateWorkspaceState(key: string, value: any, context: vscode.ExtensionContext): Promise<void> {
  await context.workspaceState.update(key, value);
}

export async function getWorkspaceState(key: string, context: vscode.ExtensionContext): Promise<any> {
  return context.workspaceState.get(key);
}
