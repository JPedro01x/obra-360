import net from 'node:net';
import http from 'node:http';
function textOf(raw) {
  const split = raw.indexOf('\r\n\r\n'),
    headers = raw.slice(0, split),
    body = raw.slice(split + 4);
  if (/Content-Transfer-Encoding:\s*base64/i.test(headers))
    return Buffer.from(body.replace(/\s/g, ''), 'base64').toString('utf8');
  return body
    .replace(/=\r?\n/g, '')
    .replace(/=([a-f0-9]{2})/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
}
export async function createSmtpCapture() {
  const messages = [];
  const sockets = new Set();
  const smtp = net.createServer((socket) => {
    sockets.add(socket);
    socket.on('close', () => sockets.delete(socket));
    socket.setEncoding('utf8');
    socket.write('220 localhost ESMTP test capture\r\n');
    let buffer = '',
      data = false,
      lines = [];
    socket.on('data', (chunk) => {
      buffer += chunk;
      let end;
      while ((end = buffer.indexOf('\r\n')) >= 0) {
        const line = buffer.slice(0, end);
        buffer = buffer.slice(end + 2);
        if (data) {
          if (line === '.') {
            data = false;
            const raw = lines.join('\r\n');
            if (messages.length < 50) messages.push({ raw, text: textOf(raw) });
            lines = [];
            socket.write('250 Message captured\r\n');
          } else lines.push(line.startsWith('..') ? line.slice(1) : line);
          continue;
        }
        if (/^(EHLO|HELO)/i.test(line)) socket.write('250 localhost\r\n');
        else if (/^MAIL FROM:/i.test(line)) socket.write('250 OK\r\n');
        else if (/^RCPT TO:/i.test(line))
          socket.write(
            /@test\.invalid>?$/i.test(line) ? '250 OK\r\n' : '550 Test recipients only\r\n',
          );
        else if (/^DATA$/i.test(line)) {
          data = true;
          socket.write('354 End with dot\r\n');
        } else if (/^QUIT$/i.test(line)) {
          socket.end('221 Bye\r\n');
        } else if (/^(RSET|NOOP)/i.test(line)) socket.write('250 OK\r\n');
        else socket.write('502 Unsupported test command\r\n');
      }
    });
  });
  const api = http.createServer((request, response) => {
    if (request.url !== '/messages') {
      response.writeHead(404).end();
      return;
    }
    response.writeHead(200, { 'Content-Type': 'application/json' });
    response.end(JSON.stringify(messages));
  });
  const listen = (server, port) =>
    new Promise((resolve, reject) => {
      server.once('error', reject);
      server.listen(port, '127.0.0.1', resolve);
    });
  try {
    await listen(smtp, 1025);
    await listen(api, 8025);
  } catch (error) {
    smtp.close();
    api.close();
    throw error;
  }
  return {
    close() {
      for (const socket of sockets) socket.destroy();
      smtp.close();
      api.close();
    },
  };
}
