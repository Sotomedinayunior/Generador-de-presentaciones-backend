const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/pdfController');

const multer = require('multer');
const path = require('path');
const fs = require('fs');

// En Vercel: /tmp ; en local: backend/uploads
const uploadsDir = process.env.VERCEL ? '/tmp' : path.join(__dirname, '..', 'uploads');
fs.mkdirSync(uploadsDir, { recursive: true });

const upload = multer({
  dest: uploadsDir,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ok = /^image\/(png|jpe?g)$/i.test(file.mimetype || '');
    cb(ok ? null : new Error('Solo PNG/JPG'), ok);
  }
});

router.get('/campos', ctrl.getCampos);
router.post('/documentos', ctrl.createDocumento);
router.post('/documentos/pagina/1', upload.any(), ctrl.updatePagina);

module.exports = router;
