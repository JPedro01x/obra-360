import { expect, test } from '@playwright/test';
import { parseWorkspaceSseFrames } from '../../src/services/realtimeSse';

test('keeps an incomplete SSE frame until the remaining chunk arrives', () => {
  const first = parseWorkspaceSseFrames('event: workspace-change\ndata: {"module":');
  expect(first.events).toEqual([]);

  const second = parseWorkspaceSseFrames(`${first.remainder}"workspace"}\n\n`);
  expect(second.events).toEqual([
    { event: 'workspace-change', id: undefined, data: '{"module":"workspace"}' },
  ]);
  expect(second.remainder).toBe('');
});

test('parses event id and multi-line data with CRLF separators', () => {
  const parsed = parseWorkspaceSseFrames(
    'id: 42\r\nevent: workspace-change\r\ndata: {"id":"42",\r\ndata: "module":"workspace"}\r\n\r\n',
  );
  expect(parsed.events).toEqual([
    { event: 'workspace-change', id: '42', data: '{"id":"42",\n"module":"workspace"}' },
  ]);
  expect(parsed.remainder).toBe('');
});
