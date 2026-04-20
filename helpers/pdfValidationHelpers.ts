import { PDFParse } from 'pdf-parse';
import { promises as fs } from 'fs';
import path from 'path';
import { expect } from '@playwright/test';

export default class PdfValidationHelpers {

    static async validateDownloadedPdf(
        fileName: string,
        should: 'contain' | 'not.contain' = 'contain',
        expectations: string[],
    ) {
        const filePath = path.join(process.cwd(), 'downloads', fileName);
        const buffer = await fs.readFile(filePath);
        const { text } = await new PDFParse({ data: buffer }).getText();

        for (const expectation of expectations) {
            if (should === 'contain') {
                expect(text).toContain(expectation);
            } else {
                expect(text).not.toContain(expectation);
            }
        }
    }
}
