const express           = require('express');
const path              = require('path');
const fs                = require('fs');
const basicAuth         = require('express-basic-auth');
const multer            = require('multer');

const app = express();

// 0) Override CSP to allow SoundCloud embeds
app.use((req, res, next) => {
  res.setHeader('Content-Security-Policy',
    "default-src 'self' https://w.soundcloud.com https://api.soundcloud.com; " +
    "script-src 'self' https://w.soundcloud.com 'unsafe-eval' 'unsafe-inline'; " +
    "frame-src https://w.soundcloud.com; " +
    "connect-src https://api.soundcloud.com; " +
    "style-src 'self' 'unsafe-inline';"
  );
  next();
});

// 1) Body parsing
app.use(express.urlencoded({ extended: true }));

// 2) Multer setup for file uploads
const UPLOAD_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR);
const upload = multer({ dest: UPLOAD_DIR });

// 3) Protect Admin with Basic Auth
app.use(['/admin', '/admin.html'], basicAuth({
  users: { 'WYRMWorld': 'Bigcbigc33' },
  challenge: true,
  realm: 'WYRMWorldAdmin'
}));

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// 4) Submission endpoint
let submissions = [];
app.post('/submit', upload.single('track'), (req, res) => {
  const { name, type } = req.body;
  const originalName   = req.file?.originalname || '';
  const storedName     = req.file?.filename     || '';
  submissions.push({ name, originalName, storedName, type });
  res.redirect('/submit.html');
});

// 5) API for submissions
app.get('/submissions', (req, res) => {
  res.json(submissions);
});

// 6) Listen page routes
app.get('/listen',      (req, res) => res.sendFile(path.join(__dirname, 'public', 'listen.html')));
app.get('/listen.html', (req, res) => res.sendFile(path.join(__dirname, 'public', 'listen.html')));

// 7) Serve uploaded files
app.use('/uploads', express.static(UPLOAD_DIR));

// 8) Serve static assets
app.use(express.static(path.join(__dirname, 'public')));

// 9) Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
