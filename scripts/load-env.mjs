import { readFile } from 'node:fs/promises';
import path from 'node:path';
export async function loadProjectEnv(root) {
  const values = {};
  for (const filename of [path.join(root, '.env'), path.join(root, 'obra360-backend', '.env')]) {
    let contents;
    try {
      contents = await readFile(filename, 'utf8');
    } catch (error) {
      if (error.code === 'ENOENT') continue;
      throw error;
    }
    for (const line of contents.split(/\r?\n/)) {
      const match = line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
      if (!match) continue;
      let value = match[2].trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      )
        value = value.slice(1, -1);
      values[match[1]] = value;
    }
  }
  return { ...values, ...process.env };
}
