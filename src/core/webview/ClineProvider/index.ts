import * as vscode from "vscode";
import { getNonce } from "../getNonce";
import { getUri } from "../getUri";
import { handleWebviewMessage } from "./utils";
import { handleMcpMessage } from "./mcp";
import { handleDiagnosticsMessage } from "./diagnostics";
import { handleOllamaMessage } from "./ollama";
import { handleLmStudioMessage } from "./lmstudio";
import { handleOpenRouterMessage } from "./openrouter";
import { handleTaskHistoryMessage } from "./taskHistory";
import { handleStateMessage } from "./state";
import { handleSecretsMessage } from "./secrets";

export class ClineProvider implements vscode.WebviewViewProvider {
  public static readonly sideBarId = "bao-cline.SidebarProvider";
  public static readonly tabPanelId = "bao-cline.TabPanelProvider";
  private _view?: vscode.WebviewView;
  private _context: vscode.ExtensionContext;
  private _outputChannel: vscode.OutputChannel;

  constructor(context: vscode.ExtensionContext, outputChannel: vscode.OutputChannel) {
    this._context = context;
    this._outputChannel = outputChannel;
  }

  public resolveWebviewView(webviewView: vscode.WebviewView): void | Thenable<void> {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._context.extensionUri],
    };

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

    webviewView.webview.onDidReceiveMessage(async (message) => {
      switch (message.type) {
        case "webview":
          await handleWebviewMessage(message, this._context, this._outputChannel);
          break;
        case "mcp":
          await handleMcpMessage(message, this._context, this._outputChannel);
          break;
        case "diagnostics":
          await handleDiagnosticsMessage(message, this._context, this._outputChannel);
          break;
        case "ollama":
          await handleOllamaMessage(message, this._context, this._outputChannel);
          break;
        case "lmstudio":
          await handleLmStudioMessage(message, this._context, this._outputChannel);
          break;
        case "openrouter":
          await handleOpenRouterMessage(message, this._context, this._outputChannel);
          break;
        case "taskHistory":
          await handleTaskHistoryMessage(message, this._context, this._outputChannel);
          break;
        case "state":
          await handleStateMessage(message, this._context, this._outputChannel);
          break;
        case "secrets":
          await handleSecretsMessage(message, this._context, this._outputChannel);
          break;
        default:
          this._outputChannel.appendLine(`Unknown message type: ${message.type}`);
      }
    });
  }

  private _getHtmlForWebview(webview: vscode.Webview): string {
    const nonce = getNonce();
    const scriptUri = getUri(webview, this._context.extensionUri, ["webview-ui", "build", "bundle.js"]);
    const styleUri = getUri(webview, this._context.extensionUri, ["webview-ui", "build", "bundle.css"]);

    return `<!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Cline</title>
        <link rel="stylesheet" type="text/css" href="${styleUri}">
      </head>
      <body>
        <div id="root"></div>
        <script nonce="${nonce}" src="${scriptUri}"></script>
      </body>
      </html>`;
  }

  public static getVisibleInstance(): ClineProvider | undefined {
    const visibleView = vscode.window.visibleTextEditors.find(
      (editor) => editor.document.uri.scheme === "vscode-webview"
    );
    if (visibleView) {
      const provider = visibleView.viewColumn ? vscode.window.activeTextEditor : undefined;
      return provider ? (provider as unknown as ClineProvider) : undefined;
    }
    return undefined;
  }

  public async clearTask(): Promise<void> {
    // Implement the logic to clear the current task
  }

  public async postStateToWebview(): Promise<void> {
    // Implement the logic to post the current state to the webview
  }

  public async postMessageToWebview(message: any): Promise<void> {
    if (this._view) {
      this._view.webview.postMessage(message);
    }
  }

  public async handleOpenRouterCallback(code: string): Promise<void> {
    // Implement the logic to handle OpenRouter callback
  }
}
