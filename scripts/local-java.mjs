import { spawnSync } from 'node:child_process';
import { readdir } from 'node:fs/promises';
import path from 'node:path';

export function java21Home(output) {
  if (!/version\s+"21(?:\.|"|-)/.test(output)) return null;
  return output.match(/^\s*java\.home = (.+)$/m)?.[1]?.trim() || null;
}
export async function useLocalJava21() {
  const executable = home => path.join(home, 'bin', process.platform === 'win32' ? 'java.exe' : 'java');
  const inspect = command => {
    const result = spawnSync(command, ['-XshowSettings:properties', '-version'], { encoding: 'utf8', windowsHide: true, timeout: 5000 });
    return result.status === 0 ? java21Home((result.stderr || '') + '\n' + (result.stdout || '')) : null;
  };
  let home = process.env.JAVA_HOME && inspect(executable(process.env.JAVA_HOME));
  if (!home) home = inspect('java');
  if (!home && process.platform === 'win32') {
    for (const root of ['C:/Program Files/Java', 'C:/Program Files/Eclipse Adoptium', 'C:/Program Files/Microsoft']) {
      const entries = await readdir(root, { withFileTypes: true }).catch(() => []);
      for (const entry of entries.filter(e => e.isDirectory() && /(?:jdk|java).*21/i.test(e.name))) {
        home = inspect(executable(path.join(root, entry.name)));
        if (home) break;
      }
      if (home) break;
    }
  }
  if (!home) throw new Error('JDK 21 não encontrado. Instale-o e configure JAVA_HOME antes de executar npm run dev.');
  process.env.JAVA_HOME = home;
  const pathKey = Object.keys(process.env).find(key => key.toLowerCase() === 'path') || 'PATH';
  process.env[pathKey] = path.join(home, 'bin') + path.delimiter + (process.env[pathKey] || '');
  console.log('Java 21 selecionado para esta execução local.');
  return home;
}
