const express = require('express');
const router = express.Router();

const ctrl = require('../controllers/pdfController');

const multer = require('multer');
const path = require('path');
const fs = require('fs');

/**
 * En Vercel sólo /tmp es escribible.
 * En local seguimos usando /uploads del proyecto.
 */
const uploadsDir = process.env.VERCEL
  ? '/tmp/uploads'
  : path.join(__dirname, '..', 'uploads');

fs.mkdirSync(uploadsDir, { recursive: true });

const upload = multer({
  dest: uploadsDir,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (req, file, cb) => {
    const ok = /^image\/(png|jpe?g)$/i.test(file.mimetype || '');
    cb(ok ? null : new Error('Solo PNG/JPG'), ok);
  },
});

router.get('/campos', ctrl.getCampos);
router.post('/documentos', ctrl.createDocumento);

// Mismo endpoint para p1 y p2: el controller decide por req.body.page
router.post('/documentos/pagina/1', upload.any(), ctrl.updatePagina);

module.exports = router;
