import path from 'node:path';

// One shared definition prevents backup/restore commands from targeting a different stack.
export function productionComposeArgs(root, envFile, messaging = 'false') {
  if (!['true', 'false'].includes(messaging)) {
    throw new Error('OBRA360_COMPOSE_MESSAGING deve ser true ou false.');
  }
  const args = ['compose', '--env-file', envFile, '-f', path.join(root, 'deploy/compose.production.yml')];
  if (messaging === 'true') args.push('-f', path.join(root, 'deploy/compose.production.messaging.yml'));
  return args;
}
