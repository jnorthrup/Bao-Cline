import { execSync } from 'child_process';
import { join } from 'path';

export class RedlineWrapper {
    private readonly scriptPath: string;

    constructor() {
        this.scriptPath = join(__dirname, 'redline.sh');
    }

    private executeCommand(command: string, operation: string): string {
        try {
            return execSync(command, { encoding: 'utf8' });
        } catch (error) {
            // When the script fails, it outputs the regex pattern
            const regexOutput = execSync(`${this.scriptPath} ${operation}`, { encoding: 'utf8' });
            throw new Error(`Operation failed: ${error.message}\nExpected regex: ${regexOutput}`);
        }
    }

    public scan(globPattern?: string, regexPattern?: string): string {
        if (!globPattern || !regexPattern) {
            return execSync(`${this.scriptPath} scan`, { encoding: 'utf8' });
        }
        const command = `${this.scriptPath} scan "${globPattern}" "${regexPattern}"`;
        return this.executeCommand(command, 'scan');
    }

    public edit(filePath?: string, newContent?: string, startLine?: number, endLine?: number): string {
        if (!filePath || !newContent || !startLine || !endLine) {
            return execSync(`${this.scriptPath} edit`, { encoding: 'utf8' });
        }
        const command = `${this.scriptPath} edit "${filePath}" "${newContent}" ${startLine} ${endLine}`;
        return this.executeCommand(command, 'edit');
    }

    public verify(filePath1?: string, filePath2?: string, startLine?: number, endLine?: number): string {
        if (!filePath1 || !filePath2 || !startLine || !endLine) {
            return execSync(`${this.scriptPath} verify`, { encoding: 'utf8' });
        }
        const command = `${this.scriptPath} verify "${filePath1}" "${filePath2}" ${startLine} ${endLine}`;
        return this.executeCommand(command, 'verify');
    }
}
