export type WorkspaceSseFrame = { event: string; id?: string; data: string };

/** Parses complete SSE frames and leaves a partial trailing frame for the next chunk. */
export function parseWorkspaceSseFrames(buffer: string): {
  events: WorkspaceSseFrame[];
  remainder: string;
} {
  const events: WorkspaceSseFrame[] = [];
  let boundary = buffer.search(/\r?\n\r?\n/);

  while (boundary >= 0) {
    const frame = buffer.slice(0, boundary);
    const separator = buffer.slice(boundary).match(/^\r?\n\r?\n/)?.[0] || '\n\n';
    buffer = buffer.slice(boundary + separator.length);

    let event = 'message';
    let id: string | undefined;
    let data = '';
    for (const line of frame.split(/\r?\n/)) {
      if (!line || line.startsWith(':')) continue;
      const colon = line.indexOf(':');
      const field = colon < 0 ? line : line.slice(0, colon);
      const rawValue = colon < 0 ? '' : line.slice(colon + 1);
      const value = rawValue.startsWith(' ') ? rawValue.slice(1) : rawValue;
      if (field === 'event') event = value;
      else if (field === 'id' && !value.includes('\0')) id = value;
      else if (field === 'data') data += `${value}\n`;
    }
    if (data) data = data.slice(0, -1);
    events.push({ event, id, data });
    boundary = buffer.search(/\r?\n\r?\n/);
  }

  return { events, remainder: buffer };
}
