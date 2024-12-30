const fs = require('mz/fs');
const path = require('path');
const http = require('http');
const url = require('url');
const { Readable } = require('stream');
const colors = require('colors/safe');

// Animasyon çerçevelerini yükleyin
let originalFrames;
let flippedFrames;

(async () => {
  const framesPath = 'frames'; // Animasyon çerçevelerinin bulunduğu dizin
  const files = await fs.readdir(framesPath);

  // Çerçeveleri oku
  originalFrames = await Promise.all(files.map(async (file) => {
    const frame = await fs.readFile(path.join(framesPath, file));
    return frame.toString();
  }));

  // Çerçeveleri ters çevir
  flippedFrames = originalFrames.map(f => f.split('').reverse().join(''));
})().catch((err) => {
  console.log('Error loading frames');
  console.log(err);
});

const colorsOptions = [
  'red', 'yellow', 'green', 'blue', 'magenta', 'cyan', 'white'
];
const numColors = colorsOptions.length;

const selectColor = (previousColor) => {
  let color;
  do {
    color = Math.floor(Math.random() * numColors);
  } while (color === previousColor);

  return color;
};

const streamer = (stream, opts) => {
  let index = 0;
  let lastColor;
  const frames = opts.flip ? flippedFrames : originalFrames;

  return setInterval(() => {
    // Terminali temizle
    stream.push('\033[2J\033[3J\033[H');
    const newColor = selectColor(lastColor);
    stream.push(colors[colorsOptions[newColor]](frames[index]));

    index = (index + 1) % frames.length;
  }, 70);
};

const validateQuery = ({ flip }) => ({
  flip: String(flip).toLowerCase() === 'true'
});

const server = http.createServer((req, res) => {
  if (req.url === '/healthcheck') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ status: 'ok' }));
  }

  if (req.headers && req.headers['user-agent'] && !req.headers['user-agent'].includes('curl')) {
    res.writeHead(302, { Location: 'https://github.com/hugomd/parrot.live' });
    return res.end();
  }

  const stream = new Readable();
  stream._read = function noop() {};
  stream.pipe(res);
  const interval = streamer(stream, validateQuery(url.parse(req.url, true).query));

  req.on('close', () => {
    stream.destroy();
    clearInterval(interval);
  });
});

const port = process.env.PARROT_PORT || 3000;
server.listen(port, err => {
  if (err) throw err;
  console.log(`Listening on localhost:${port}`);
});
