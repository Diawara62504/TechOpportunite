const multer = require('multer');
const path = require('path');

// Configuration du stockage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // Dossier où stocker les fichiers
  },
  filename: function (req, file, cb) {
    // Générer un nom de fichier unique
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Filtre pour accepter seulement certains types de fichiers
const fileFilter = (req, file, cb) => {
  // Accepter: CV (pdf/doc), portfolio (pdf/doc), photo (image/*), logo (image/*)
  if (file.fieldname === 'cv' || file.fieldname === 'portfolio') {
    if (
      file.mimetype === 'application/pdf' ||
      file.mimetype === 'application/msword' ||
      file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      cb(null, true);
    } else {
      cb(new Error('Seuls les fichiers PDF et Word sont acceptés pour CV/Portfolio'), false);
    }
  } else if (file.fieldname === 'photo' || file.fieldname === 'logo') {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Seules les images sont acceptées pour la photo/logo'), false);
    }
  } else {
    cb(new Error('Type de fichier non supporté'), false);
  }
};

// Configuration de multer (limites et types)
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    // 2 Mo pour les images, 5 Mo pour docs — multer ne fait pas par champ, on prend 5 Mo global
    fileSize: 5 * 1024 * 1024
  }
});

module.exports = upload;
