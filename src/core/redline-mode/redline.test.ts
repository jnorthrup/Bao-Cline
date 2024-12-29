import { RedlineWrapper } from './redline-wrapper';
import { writeFileSync, unlinkSync } from 'fs';
import { expect } from 'chai';

describe('RedlineWrapper', function() {
    const redline = new RedlineWrapper();
    const testFile = 'test-file.txt';

    before(function() {
        // Create a test file
        writeFileSync(testFile, 'line1\nline2\nline3\nline4\nline5');
    });

    after(function() {
        // Clean up test file
        unlinkSync(testFile);
    });

    it('should scan for patterns', function() {
        const result = redline.scan('*.txt', 'line[23]');
        expect(result).to.contain('line2');
        expect(result).to.contain('line3');
    });

    it('should edit file content', function() {
        const editResult = redline.edit(testFile, 'new_line', 2, 4);
        expect(editResult).to.contain('Editing file');

        const verifyResult = redline.verify(testFile, testFile, 2, 4);
        expect(verifyResult).to.be.true;
    });

    it('should verify file changes', function() {
        const originalContent = 'line1\nline2\nline3\nline4\nline5';
        writeFileSync(testFile, originalContent);

        redline.edit(testFile, 'modified_line', 3, 4);
        const verifyResult = redline.verify(testFile, testFile, 3, 4);
        expect(verifyResult).to.be.true;
    });
});
