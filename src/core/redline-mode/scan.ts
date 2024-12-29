import { promises as fs } from 'fs';
import { listFiles } from "../../services/glob/list-files";

export interface ScanResult {
    file: string;
    line: number;
}

export class Scanner {
    private maxLines: number;

    constructor(maxLines: number = 100) {
        this.maxLines = maxLines;
    }

    public async scan(globPattern: string, regexPattern: string): Promise<ScanResult[]> {
        const [files] = await listFiles(process.cwd(), true, 200);
        const matchingFiles = files.filter((file) => file.match(new RegExp(globPattern, "i")));

        const results: ScanResult[] = [];

        for (const file of matchingFiles) {
            try {
                const content = await fs.readFile(file, 'utf8');
                const lines = content.split("\n");
                
                const maxLinesToProcess = Math.min(lines.length, this.maxLines);
                for (let i = 0; i < maxLinesToProcess; i++) {
                    if (lines[i].match(new RegExp(regexPattern))) {
                        results.push({
                            file,
                            line: i + 1
                        });
                    }
                }
            } catch (error) {
                console.error(`Error scanning file ${file}:`, error);
            }
        }

        return results;
    }
}
