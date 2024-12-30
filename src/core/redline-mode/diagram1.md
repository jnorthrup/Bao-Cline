sequenceDiagram
    participant Cline
    participant User
    participant API
    participant Webview
    participant DiffViewProvider
    participant BrowserSession

    Note over Cline: Start presenting assistant message
    Cline->>Cline: Check if aborted or locked
    alt Aborted
        Cline->>Cline: Throw error
    else PresentAssistantMessageLocked
        Cline->>Cline: Set presentAssistantMessageHasPendingUpdates to true
        Cline->>Cline: Return
    end
    Cline->>Cline: Set presentAssistantMessageLocked to true
    Cline->>Cline: Set presentAssistantMessageHasPendingUpdates to false
    Cline->>Cline: Check if currentStreamingContentIndex is out of bounds
    alt Out of bounds and didCompleteReadingStream
        Cline->>Cline: Set userMessageContentReady to true
        Cline->>Cline: Set presentAssistantMessageLocked to false
        Cline->>Cline: Return
    end
    Cline->>Cline: Get current content block
    alt Block type is "text"
        Cline->>Cline: Clean up content (remove partial tags, etc.)
        Cline->>Webview: Send "say" message with text content
    else Block type is "tool_use"
        Cline->>Cline: Extract tool name and parameters
        alt User rejected previous tool
            Cline->>Cline: Add message to userMessageContent indicating tool skipped
        else Tool already used in this message
            Cline->>Cline: Add message to userMessageContent indicating tool not executed
        else
            alt Tool is not "browser_action"
                Cline->>BrowserSession: Close browser
            end
            alt Tool is "write_to_file" or "replace_in_file"
                alt Block is partial
                    Cline->>Webview: Send "ask" or "say" message with partial tool info
                    alt DiffViewProvider is not editing
                        Cline->>DiffViewProvider: Open file in editor
                    end
                    Cline->>DiffViewProvider: Update editor with new content
                else Block is complete
                    alt Auto-approval enabled for this tool
                        Cline->>Webview: Send "say" message with complete tool info
                    else
                        Cline->>User: Show notification for approval
                        Cline->>Webview: Send "ask" message for approval
                        alt User approves
                            Cline->>DiffViewProvider: Save changes to file
                            Cline->>Cline: Handle user edits and new problems
                        else User rejects
                            Cline->>DiffViewProvider: Revert changes
                        end
                    end
                end
            else Other tools
                alt Block is partial
                    Cline->>Webview: Send "ask" or "say" message with partial tool info
                else Block is complete
                    alt Auto-approval enabled for this tool
                        Cline->>Webview: Send "say" message with complete tool info
                    else
                        Cline->>User: Show notification for approval
                        Cline->>Webview: Send "ask" message for approval
                        alt User approves
                            Cline->>Cline: Execute tool
                            Cline->>Webview: Send "say" message with tool result
                        else User rejects
                            Cline->>Cline: Handle rejection
                        end
                    end
                end
            end
        end
    end
    Cline->>Cline: Set presentAssistantMessageLocked to false
    alt Block is not partial or tool rejected or already used
        Cline->>Cline: Increment currentStreamingContentIndex
        alt More content blocks to stream
            Cline->>Cline: Call presentAssistantMessage() recursively
        end
    else Block is partial and no updates pending
        Cline->>Cline: Wait for updates
    end
    Note over Cline: Finish presenting assistant message
Explanation:

The diagram starts with the Cline object initiating the presentAssistantMessage() function.
It checks if the operation is aborted or if another message is already being presented.
It then gets the current content block from the assistantMessageContent array.
If the block type is "text", it cleans up the content and sends it to the Webview using the say() function.
If the block type is "tool_use", it extracts the tool name and parameters.
It handles cases where the user has rejected a previous tool or a tool has already been used in the current message.
It then proceeds based on the specific tool type:
For "write_to_file" and "replace_in_file", it handles partial and complete blocks differently, interacting with the DiffViewProvider to update the editor and handle user approval.
For other tools, it handles partial and complete blocks, user approval (or auto-approval), and tool execution.
After processing the block, it either recursively calls itself to process the next block or waits for updates if the block is partial.
Limitations:

The diagram is a simplified representation of the actual code and may not capture all the nuances and edge cases.
It focuses on the main flow and doesn't show all the error handling and cleanup logic.
The interaction with the API and the streaming of the response are not shown in detail.
Despite these limitations, the UML diagram provides a good overview of the presentAssistantMessage() function's behavior and how it handles different types of content blocks and user interactions. It should be helpful in understanding the overall flow and identifying potential areas for modification to enforce redline mode.

