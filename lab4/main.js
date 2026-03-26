const http = require('http');
const fs = require('fs').promises;
const path = require('path');
const { Command } = require('commander');
const { XMLBuilder } = require('fast-xml-parser');

const program = new Command();

program
  .requiredOption('-i, --input <path>', 'path to input JSON file')
  .requiredOption('-h, --host <host>', 'server host')
  .requiredOption('-p, --port <port>', 'server port');

program.parse(process.argv);

const options = program.opts();
const inputPath = path.resolve(options.input);
const host = options.host;
const port = Number(options.port);

async function readJsonFile(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.error('Cannot find input file');
      process.exit(1);
    }

    console.error('Error reading file:', error.message);
    process.exit(1);
  }
}

function buildXml(data, includeMfo, onlyNormal) {
  let filtered = data;

  if (onlyNormal) {
    filtered = filtered.filter(item => Number(item.COD_STATE) === 1);
  }

  const banks = filtered.map(item => {
    const bank = {
      name: item.SHORTNAME ?? '',
      state_code: item.COD_STATE ?? ''
    };

    if (includeMfo) {
      bank.mfo_code = item.MFO ?? '';
    }

    return bank;
  });

  const builder = new XMLBuilder({
    ignoreAttributes: false,
    format: true
  });

  const xmlObject = {
    banks: {
      bank: banks
    }
  };

  return builder.build(xmlObject);
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${host}:${port}`);

    const includeMfo = url.searchParams.get('mfo') === 'true';
    const onlyNormal = url.searchParams.get('normal') === 'true';

    const jsonData = await readJsonFile(inputPath);
    const xml = buildXml(jsonData, includeMfo, onlyNormal);

    res.writeHead(200, { 'Content-Type': 'application/xml; charset=utf-8' });
    res.end(xml);
  } catch (error) {
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Internal Server Error');
  }
});

server.listen(port, host, () => {
  console.log(`Server running at http://${host}:${port}`);
});