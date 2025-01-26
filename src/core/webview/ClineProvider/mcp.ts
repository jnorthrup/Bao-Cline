import * as vscode from "vscode";
import { McpHub } from "../../services/mcp/McpHub";
import { McpServer, McpTool, McpResource, McpResourceTemplate } from "../../shared/mcp";

export async function handleMcpMessage(message: any, context: vscode.ExtensionContext, outputChannel: vscode.OutputChannel): Promise<void> {
  const mcpHub = new McpHub(context);

  switch (message.command) {
    case "getMcpServers":
      const servers = mcpHub.getServers();
      await postMessageToWebview({ type: "mcpServers", servers });
      break;
    case "readResource":
      const resource = await mcpHub.readResource(message.serverName, message.uri);
      await postMessageToWebview({ type: "resource", resource });
      break;
    case "callTool":
      const toolResponse = await mcpHub.callTool(message.serverName, message.toolName, message.toolArguments);
      await postMessageToWebview({ type: "toolResponse", toolResponse });
      break;
    case "toggleToolAlwaysAllow":
      await mcpHub.toggleToolAlwaysAllow(message.serverName, message.toolName, message.shouldAllow);
      break;
    case "toggleServerDisabled":
      await mcpHub.toggleServerDisabled(message.serverName, message.disabled);
      break;
    default:
      outputChannel.appendLine(`Unknown MCP command: ${message.command}`);
  }
}

async function postMessageToWebview(message: any): Promise<void> {
  const webview = vscode.window.activeTextEditor?.document.uri.scheme === "vscode-webview" ? vscode.window.activeTextEditor : undefined;
  if (webview) {
    webview.webview.postMessage(message);
  }
}
