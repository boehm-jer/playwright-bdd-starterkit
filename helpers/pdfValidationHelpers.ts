import { PDFParse } from 'pdf-parse';
import fs from 'fs';
import path from 'path';
import { expect } from '@playwright/test';

export default class PdfValidationHelpers {

    static async validateDownloadedPdf(
        fileName: string,
        should: 'contain' | 'not.contain' = 'contain',
        expectations: string[],
    ) {
        const filePath = path.join(process.cwd(), 'downloads', fileName);
        const buffer = fs.readFileSync(filePath);
        const parser = new PDFParse({ data: buffer });
        const { text } = await parser.getText();

        for (const expectation of expectations) {
            if (should === 'contain') {
                expect(text).toContain(expectation);
            } else {
                expect(text).not.toContain(expectation);
            }
        }
    }
}
