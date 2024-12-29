import { Cline } from "../Cline";
import fs from "fs/promises";
import { listFiles } from "../../services/glob/list-files";
import pWaitFor from "p-wait-for";

interface ClineExtended extends Cline {
    cwd: string;
    getDiffViewProvider(): {
        update(content: string, immediate: boolean): Promise<void>;
        isEditing: boolean;
        saveChanges(): Promise<void>;
    };
}

export class RedlineMode {
    private cline: ClineExtended;
    private maxLines: number;
    private activeOperations: Set<string> = new Set();

    constructor(cline: ClineExtended, maxLines: number = 100) {
        this.cline = cline;
        this.maxLines = maxLines;
    }

    /**
     * SCAN phase with token efficiency safeguards
     */
    private async scan(globPattern: string, regexPattern: string): Promise<Array<{file: string, line: number}>> {
        const operationKey = `scan:${globPattern}:${regexPattern}`;
        if (this.activeOperations.has(operationKey)) {
            throw new Error(`Duplicate scan operation detected`);
        }
        
        this.activeOperations.add(operationKey);
        try {
            const [files] = await listFiles(this.cline.cwd, true, 200);
            const matchingFiles = files.filter((file) => file.match(new RegExp(globPattern, "i")));
            const results: Array<{file: string, line: number}> = [];

            for (const file of matchingFiles) {
                const content = await fs.readFile(file, 'utf-8');
                const lines = content.split("\n");
                
                // Limit number of lines processed to prevent token waste
                const maxLinesToProcess = Math.min(lines.length, this.maxLines);
                for (let i = 0; i < maxLinesToProcess; i++) {
                    if (lines[i].match(new RegExp(regexPattern))) {
                        results.push({
                            file,
                            line: i + 1 // Convert to 1-based line numbers
                        });
                    }
                }
            }

            return results;
        } finally {
            this.activeOperations.delete(operationKey);
        }
    }

    /**
     * EDIT phase with concurrency prevention
     */
    private async edit(filePath: string, newContent: string, startLine: number, endLine: number): Promise<void> {
        const operationKey = `edit:${filePath}:${startLine}:${endLine}`;
        if (this.activeOperations.has(operationKey)) {
            throw new Error(`Concurrent edit operation detected`);
        }

        this.activeOperations.add(operationKey);
        try {
            const originalContent = await fs.readFile(filePath, 'utf-8');
            const lines = originalContent.split("\n");

            if (startLine < 1 || endLine > lines.length + 1 || startLine >= endLine) {
                throw new Error(`Invalid line range ${startLine} to ${endLine} (file has ${lines.length} lines)`);
            }

            const updatedContent = [
                ...lines.slice(0, startLine - 1),
                newContent,
                ...lines.slice(endLine - 1)
            ].join("\n");

            const diffViewProvider = this.cline.getDiffViewProvider();
            await diffViewProvider.update(updatedContent, true);
            await pWaitFor(() => diffViewProvider.isEditing === false, { interval: 100 });
            await diffViewProvider.saveChanges();
        } finally {
            this.activeOperations.delete(operationKey);
        }
    }

    /**
     * VERIFY phase with strict boundaries
     */
    private async verify(filePath: string, startLine: number, endLine: number): Promise<boolean> {
        const operationKey = `verify:${filePath}:${startLine}:${endLine}`;
        if (this.activeOperations.has(operationKey)) {
            throw new Error(`Concurrent verify operation detected`);
        }

        this.activeOperations.add(operationKey);
        try {
            const originalContent = await fs.readFile(filePath, 'utf-8');
            const updatedContent = await fs.readFile(filePath, 'utf-8');
            const originalLines = originalContent.split("\n");
            const updatedLines = updatedContent.split("\n");

            if (startLine < 1 || endLine > originalLines.length + 1 || startLine >= endLine) {
                throw new Error(`Invalid line range ${startLine} to ${endLine} (file has ${originalLines.length} lines)`);
            }

            const originalRange = originalLines.slice(startLine - 1, endLine - 1).join("\n");
            const updatedRange = updatedLines.slice(startLine - 1, endLine - 1).join("\n");

            return originalRange === updatedRange;
        } finally {
            this.activeOperations.delete(operationKey);
        }
    }
}
