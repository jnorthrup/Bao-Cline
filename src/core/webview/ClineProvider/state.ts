import * as vscode from "vscode";

export async function handleStateMessage(message: any, context: vscode.ExtensionContext, outputChannel: vscode.OutputChannel): Promise<void> {
  switch (message.command) {
    case "updateGlobalState":
      await updateGlobalState(message.key, message.value, context);
      break;
    case "getGlobalState":
      const globalStateValue = await getGlobalState(message.key, context);
      await postMessageToWebview({ type: "globalState", key: message.key, value: globalStateValue });
      break;
    case "updateWorkspaceState":
      await updateWorkspaceState(message.key, message.value, context);
      break;
    case "getWorkspaceState":
      const workspaceStateValue = await getWorkspaceState(message.key, context);
      await postMessageToWebview({ type: "workspaceState", key: message.key, value: workspaceStateValue });
      break;
    default:
      outputChannel.appendLine(`Unknown state command: ${message.command}`);
  }
}

async function updateGlobalState(key: string, value: any, context: vscode.ExtensionContext): Promise<void> {
  await context.globalState.update(key, value);
}

async function getGlobalState(key: string, context: vscode.ExtensionContext): Promise<any> {
  return context.globalState.get(key);
}

async function updateWorkspaceState(key: string, value: any, context: vscode.ExtensionContext): Promise<void> {
  await context.workspaceState.update(key, value);
}

async function getWorkspaceState(key: string, context: vscode.ExtensionContext): Promise<any> {
  return context.workspaceState.get(key);
}

async function postMessageToWebview(message: any): Promise<void> {
  const webview = vscode.window.activeTextEditor?.document.uri.scheme === "vscode-webview" ? vscode.window.activeTextEditor : undefined;
  if (webview) {
    webview.webview.postMessage(message);
  }
}
