import * as vscode from "vscode";
import { getNewDiagnostics, diagnosticsToProblemsString } from "../../integrations/diagnostics";

export async function handleDiagnosticsMessage(message: any, context: vscode.ExtensionContext, outputChannel: vscode.OutputChannel): Promise<void> {
  switch (message.command) {
    case "getDiagnostics":
      const diagnostics = vscode.languages.getDiagnostics();
      await postMessageToWebview({ type: "diagnostics", diagnostics });
      break;
    case "getNewDiagnostics":
      const oldDiagnostics = message.oldDiagnostics;
      const newDiagnostics = vscode.languages.getDiagnostics();
      const newProblems = getNewDiagnostics(oldDiagnostics, newDiagnostics);
      await postMessageToWebview({ type: "newDiagnostics", newProblems });
      break;
    case "getProblemsString":
      const allDiagnostics = vscode.languages.getDiagnostics();
      const problemsString = diagnosticsToProblemsString(allDiagnostics, message.severities, message.cwd);
      await postMessageToWebview({ type: "problemsString", problemsString });
      break;
    default:
      outputChannel.appendLine(`Unknown diagnostics command: ${message.command}`);
  }
}

async function postMessageToWebview(message: any): Promise<void> {
  const webview = vscode.window.activeTextEditor?.document.uri.scheme === "vscode-webview" ? vscode.window.activeTextEditor : undefined;
  if (webview) {
    webview.webview.postMessage(message);
  }
}
