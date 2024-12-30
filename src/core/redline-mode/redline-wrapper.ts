import { execSync } from 'child_process';
import { join } from 'path';

const SCAN_REGEX = /^\s+scan\s+(?<glob_pattern>[\w\-.*?\[\]{}]+)\s+(?<regex_pattern>(?:[\w\-().\[\]{}]+|\(.*\))*)$/;
const EDIT_REGEX = /^\s+edit\s+(?<file>[\w\-\.]+)\s+(?<new_text>.+)\s+(?<start>\d+)\s+(?<end>\d+)$/;
const VERIFY_REGEX = /^\s+verify\s+(?<file1>[\w\-\.]+)\s+(?<file2>[\w\-\.]+)\s+(?<start>\d+)\s+(?<end>\d+)$/;

export interface ScanOptions {
    globPattern?: string;
    regexPattern?: string;
}

export interface EditOptions {
    filePath: string;
    newContent: string;
    startLine: number;
    endLine: number;
}

export interface VerifyOptions {
    filePath1: string;
    filePath2: string;
    startLine: number;
    endLine: number;
}

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

    public scan(options?: ScanOptions): string {
        if (!options?.globPattern || !options?.regexPattern) {
            const match = execSync(`${this.scriptPath} scan`, { encoding: 'utf8' }).match(SCAN_REGEX);
            if (!match?.groups) {
                throw new Error('Invalid scan command');
            }
            return this.executeCommand(`scan ${match.groups.glob_pattern} ${match.groups.regex_pattern}`, 'scan');
        }
        const command = `${this.scriptPath} scan "${options.globPattern}" "${options.regexPattern}"`;
        return this.executeCommand(command, 'scan');
    }

    public edit(options: EditOptions): string {
        const command = `${this.scriptPath} edit "${options.filePath}" "${options.newContent}" ${options.startLine} ${options.endLine}`;
        return this.executeCommand(command, 'edit');
    }

    public verify(options: VerifyOptions): string {
        const command = `${this.scriptPath} verify "${options.filePath1}" "${options.filePath2}" ${options.startLine} ${options.endLine}`;
        return this.executeCommand(command, 'verify');
    }

    public diff(filePath1: string, filePath2: string): string {
        const command = `${this.scriptPath} diff "${filePath1}" "${filePath2}"`;
        return this.executeCommand(command, 'diff');
    }

    public head(filePath: string, lines?: number): string {
        const command = `${this.scriptPath} head "${filePath}" ${lines || ''}`;
        return this.executeCommand(command, 'head');
    }

    public tail(filePath: string, lines?: number): string {
        const command = `${this.scriptPath} tail "${filePath}" ${lines !== undefined ? lines : ''}`;
        return this.executeCommand(command, 'tail');
    }
} 
