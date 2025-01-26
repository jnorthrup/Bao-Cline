import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs/promises";
import { HistoryItem } from "../../shared/HistoryItem";
import { fileExistsAtPath } from "../../utils/fs";
import { downloadTask } from "../../integrations/misc/export-markdown";
import { ClineProvider, GlobalFileNames } from "./index";

export async function handleTaskHistoryMessage(message: any, context: vscode.ExtensionContext, outputChannel: vscode.OutputChannel): Promise<void> {
  const clineProvider = new ClineProvider(context, outputChannel);

  switch (message.command) {
    case "showTaskWithId":
      await clineProvider.showTaskWithId(message.text);
      break;
    case "exportTaskWithId":
      await clineProvider.exportTaskWithId(message.text);
      break;
    case "deleteTaskWithId":
      await clineProvider.deleteTaskWithId(message.text);
      break;
    default:
      outputChannel.appendLine(`Unknown task history command: ${message.command}`);
  }
}

export async function getTaskWithId(id: string, context: vscode.ExtensionContext): Promise<{
  historyItem: HistoryItem;
  taskDirPath: string;
  apiConversationHistoryFilePath: string;
  uiMessagesFilePath: string;
  apiConversationHistory: any[];
}> {
  const history = ((await context.globalState.get("taskHistory")) as HistoryItem[] | undefined) || [];
  const historyItem = history.find((item) => item.id === id);
  if (historyItem) {
    const taskDirPath = path.join(context.globalStorageUri.fsPath, "tasks", id);
    const apiConversationHistoryFilePath = path.join(taskDirPath, GlobalFileNames.apiConversationHistory);
    const uiMessagesFilePath = path.join(taskDirPath, GlobalFileNames.uiMessages);
    const fileExists = await fileExistsAtPath(apiConversationHistoryFilePath);
    if (fileExists) {
      const apiConversationHistory = JSON.parse(await fs.readFile(apiConversationHistoryFilePath, "utf8"));
      return {
        historyItem,
        taskDirPath,
        apiConversationHistoryFilePath,
        uiMessagesFilePath,
        apiConversationHistory,
      };
    }
  }
  await deleteTaskFromState(id, context);
  throw new Error("Task not found");
}

export async function showTaskWithId(id: string, context: vscode.ExtensionContext, outputChannel: vscode.OutputChannel): Promise<void> {
  const clineProvider = new ClineProvider(context, outputChannel);
  if (id !== clineProvider.cline?.taskId) {
    const { historyItem } = await getTaskWithId(id, context);
    await clineProvider.initClineWithHistoryItem(historyItem);
  }
  await clineProvider.postMessageToWebview({ type: "action", action: "chatButtonClicked" });
}

export async function exportTaskWithId(id: string, context: vscode.ExtensionContext): Promise<void> {
  const { historyItem, apiConversationHistory } = await getTaskWithId(id, context);
  await downloadTask(historyItem.ts, apiConversationHistory);
}

export async function deleteTaskWithId(id: string, context: vscode.ExtensionContext, outputChannel: vscode.OutputChannel): Promise<void> {
  const clineProvider = new ClineProvider(context, outputChannel);
  if (id === clineProvider.cline?.taskId) {
    await clineProvider.clearTask();
  }

  const { taskDirPath, apiConversationHistoryFilePath, uiMessagesFilePath } = await getTaskWithId(id, context);

  await deleteTaskFromState(id, context);

  const apiConversationHistoryFileExists = await fileExistsAtPath(apiConversationHistoryFilePath);
  if (apiConversationHistoryFileExists) {
    await fs.unlink(apiConversationHistoryFilePath);
  }
  const uiMessagesFileExists = await fileExistsAtPath(uiMessagesFilePath);
  if (uiMessagesFileExists) {
    await fs.unlink(uiMessagesFilePath);
  }
  const legacyMessagesFilePath = path.join(taskDirPath, "claude_messages.json");
  if (await fileExistsAtPath(legacyMessagesFilePath)) {
    await fs.unlink(legacyMessagesFilePath);
  }
  await fs.rmdir(taskDirPath);
}

export async function deleteTaskFromState(id: string, context: vscode.ExtensionContext): Promise<void> {
  const taskHistory = ((await context.globalState.get("taskHistory")) as HistoryItem[]) || [];
  const updatedTaskHistory = taskHistory.filter((task) => task.id !== id);
  await context.globalState.update("taskHistory", updatedTaskHistory);
  const clineProvider = new ClineProvider(context, vscode.window.createOutputChannel("Cline"));
  await clineProvider.postStateToWebview();
}
