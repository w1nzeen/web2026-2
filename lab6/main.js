const http = require('http');
const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { program } = require('commander');

program
  .requiredOption('-h, --host <host>', 'server host')
  .requiredOption('-p, --port <port>', 'server port')
  .requiredOption('-c, --cache <path>', 'cache directory');

program.parse();
const options = program.opts();

if (!fs.existsSync(options.cache)) {
  fs.mkdirSync(options.cache, { recursive: true });
}

if (!fs.existsSync(path.join(__dirname, 'uploads'))) {
  fs.mkdirSync(path.join(__dirname, 'uploads'), { recursive: true });
}

const app = express();
const server = http.createServer(app);

const upload = multer({
  dest: path.join(__dirname, 'uploads')
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));

let inventory = [];
let nextId = 1;

function buildPhotoUrl(req, id) {
  return `${req.protocol}://${req.get('host')}/inventory/${id}/photo`;
}

function findItemById(id) {
  return inventory.find(item => item.id === Number(id));
}


app.get('/RegisterForm.html', (req, res) => {
  res.status(200).sendFile(path.join(__dirname, 'RegisterForm.html'));
});

app.get('/SearchForm.html', (req, res) => {
  res.status(200).sendFile(path.join(__dirname, 'SearchForm.html'));
});


app.post('/register', upload.single('photo'), (req, res) => {
  const { inventory_name, description } = req.body;

  if (!inventory_name || !inventory_name.trim()) {
    return res.status(400).json({ error: 'inventory_name is required' });
  }

  const item = {
    id: nextId++,
    inventory_name: inventory_name.trim(),
    description: description ? description.trim() : '',
    photo: req.file ? req.file.filename : null
  };

  inventory.push(item);

  res.status(201).json({
    id: item.id,
    inventory_name: item.inventory_name,
    description: item.description,
    photo_url: item.photo ? buildPhotoUrl(req, item.id) : null
  });
});


app.get('/inventory', (req, res) => {
  const result = inventory.map(item => ({
    id: item.id,
    inventory_name: item.inventory_name,
    description: item.description,
    photo_url: item.photo ? buildPhotoUrl(req, item.id) : null
  }));

  res.status(200).json(result);
});


app.get('/inventory/:id', (req, res) => {
  const item = findItemById(req.params.id);

  if (!item) {
    return res.sendStatus(404);
  }

  res.status(200).json({
    id: item.id,
    inventory_name: item.inventory_name,
    description: item.description,
    photo_url: item.photo ? buildPhotoUrl(req, item.id) : null
  });
});


app.put('/inventory/:id', (req, res) => {
  const item = findItemById(req.params.id);

  if (!item) {
    return res.sendStatus(404);
  }

  const { inventory_name, description } = req.body;

  if (inventory_name !== undefined) {
    item.inventory_name = String(inventory_name).trim();
  }

  if (description !== undefined) {
    item.description = String(description).trim();
  }

  res.status(200).json({
    id: item.id,
    inventory_name: item.inventory_name,
    description: item.description,
    photo_url: item.photo ? buildPhotoUrl(req, item.id) : null
  });
});


app.get('/inventory/:id/photo', (req, res) => {
  const item = findItemById(req.params.id);

  if (!item || !item.photo) {
    return res.sendStatus(404);
  }

  const photoPath = path.join(__dirname, 'uploads', item.photo);

  if (!fs.existsSync(photoPath)) {
    return res.sendStatus(404);
  }

  res.type('image/jpeg');
  res.status(200).sendFile(photoPath);
});


app.put('/inventory/:id/photo', upload.single('photo'), (req, res) => {
  const item = findItemById(req.params.id);

  if (!item) {
    return res.sendStatus(404);
  }

  if (!req.file) {
    return res.status(400).json({ error: 'photo is required' });
  }

  item.photo = req.file.filename;

  res.status(200).json({
    id: item.id,
    inventory_name: item.inventory_name,
    description: item.description,
    photo_url: buildPhotoUrl(req, item.id)
  });
});


app.delete('/inventory/:id', (req, res) => {
  const index = inventory.findIndex(item => item.id === Number(req.params.id));

  if (index === -1) {
    return res.sendStatus(404);
  }

  inventory.splice(index, 1);
  res.sendStatus(200);
});

app.post('/search', (req, res) => {
  const { id, has_photo } = req.body;

  const item = findItemById(id);

  if (!item) {
    return res.sendStatus(404);
  }

  let description = item.description;

  if (has_photo && item.photo) {
    description += ` Photo: ${buildPhotoUrl(req, item.id)}`;
  }

  res.status(201).json({
    id: item.id,
    inventory_name: item.inventory_name,
    description
  });
});

const methodRules = {
  '/register': ['POST'],
  '/inventory': ['GET'],
  '/RegisterForm.html': ['GET'],
  '/SearchForm.html': ['GET'],
  '/search': ['POST']
};

app.use((req, res, next) => {
  const exactPath = req.path;

  if (methodRules[exactPath] && !methodRules[exactPath].includes(req.method)) {
    return res.sendStatus(405);
  }

  if (/^\/inventory\/\d+$/.test(exactPath)) {
    if (!['GET', 'PUT', 'DELETE'].includes(req.method)) {
      return res.sendStatus(405);
    }
  }

  if (/^\/inventory\/\d+\/photo$/.test(exactPath)) {
    if (!['GET', 'PUT'].includes(req.method)) {
      return res.sendStatus(405);
    }
  }

  next();
});

app.use((req, res) => {
  res.sendStatus(404);
});

server.listen(Number(options.port), options.host, () => {
  console.log(`Server running at http://${options.host}:${options.port}`);
});