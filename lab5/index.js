const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { Command } = require('commander');
const superagent = require('superagent');

const program = new Command();

program
  .requiredOption('-h, --host <host>', 'server host')
  .requiredOption('-p, --port <port>', 'server port')
  .requiredOption('-c, --cache <path>', 'cache directory path');

program.parse(process.argv);

const options = program.opts();

const HOST = options.host;
const PORT = Number(options.port);
const CACHE_DIR = path.resolve(options.cache);

async function ensureCacheDir() {
  await fs.promises.mkdir(CACHE_DIR, { recursive: true });
}

function getFilePathFromCode(code) {
  return path.join(CACHE_DIR, `${code}.jpg`);
}

function sendText(res, statusCode, text) {
  res.writeHead(statusCode, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end(text);
}

async function handleGet(code, res) {
  const filePath = getFilePathFromCode(code);

  try {
    const fileBuffer = await fs.promises.readFile(filePath);
    res.writeHead(200, { 'Content-Type': 'image/jpeg' });
    return res.end(fileBuffer);
  } catch (error) {
    if (error.code !== 'ENOENT') {
      return sendText(res, 500, 'Internal Server Error');
    }
  }

  try {
    const response = await superagent
      .get(`https://http.cat/${code}`)
      .responseType('blob');

    const imageBuffer = Buffer.from(response.body);

    await fs.promises.writeFile(filePath, imageBuffer);

    res.writeHead(200, { 'Content-Type': 'image/jpeg' });
    return res.end(imageBuffer);
  } catch (error) {
    return sendText(res, 404, 'Not Found');
  }
}

async function handlePut(code, req, res) {
  const filePath = getFilePathFromCode(code);
  const chunks = [];

  req.on('data', (chunk) => {
    chunks.push(chunk);
  });

  req.on('end', async () => {
    try {
      const bodyBuffer = Buffer.concat(chunks);
      await fs.promises.writeFile(filePath, bodyBuffer);
      res.writeHead(201, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Created');
    } catch (error) {
      sendText(res, 500, 'Internal Server Error');
    }
  });

  req.on('error', () => {
    sendText(res, 500, 'Internal Server Error');
  });
}

async function handleDelete(code, res) {
  const filePath = getFilePathFromCode(code);

  try {
    await fs.promises.unlink(filePath);
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Deleted');
  } catch (error) {
    if (error.code === 'ENOENT') {
      return sendText(res, 404, 'Not Found');
    }

    return sendText(res, 500, 'Internal Server Error');
  }
}

async function requestHandler(req, res) {
  const code = req.url.replace('/', '').trim();

  if (!code) {
    return sendText(res, 404, 'Not Found');
  }

  if (req.method === 'GET') {
    return handleGet(code, res);
  }

  if (req.method === 'PUT') {
    return handlePut(code, req, res);
  }

  if (req.method === 'DELETE') {
    return handleDelete(code, res);
  }

  return sendText(res, 405, 'Method Not Allowed');
}

async function startServer() {
  try {
    await ensureCacheDir();

    const server = http.createServer((req, res) => {
      requestHandler(req, res);
    });

    server.listen(PORT, HOST, () => {
      console.log(`Server started at http://${HOST}:${PORT}`);
      console.log(`Cache directory: ${CACHE_DIR}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
}

startServer();