import { fileURLToPath } from 'url';
import path from 'path';
export const getFixturePath = filename => path.join(__dirname, '..', '__fixtures__', filename);
export const __filename = fileURLToPath(import.meta.url)
export const __dirname = path.dirname(__filename)
