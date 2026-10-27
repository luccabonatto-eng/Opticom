// Compatibilidade com o comando antigo: node server.js.
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

const server = await createServer({
  root: fileURLToPath(new URL('.', import.meta.url)),
  server: { port: 3000, strictPort: true },
});
await server.listen();
server.printUrls();
