import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer configuration for different file types
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let subfolder = 'general';
    
    // Organize files by type
    if (file.fieldname === 'mugshot' || file.fieldname === 'foto-segnaletica') {
      subfolder = 'mugshots';
    } else if (file.fieldname === 'vehicle-photo' || file.fieldname === 'foto-veicolo') {
      subfolder = 'vehicles';
    } else if (file.fieldname === 'document') {
      subfolder = 'documents';
    }
    
    const destPath = path.join(uploadsDir, subfolder);
    if (!fs.existsSync(destPath)) {
      fs.mkdirSync(destPath, { recursive: true });
    }
    
    cb(null, destPath);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + extension);
  }
});

// File filter function
const fileFilter = (req: any, file: any, cb: any) => {
  // Allowed file types
  const allowedImageTypes = /jpeg|jpg|png|gif|webp/;
  const allowedDocumentTypes = /pdf|doc|docx|txt/;
  
  const extname = path.extname(file.originalname).toLowerCase();
  const mimetype = file.mimetype;
  
  // Check if it's an image
  if (allowedImageTypes.test(extname) && mimetype.startsWith('image/')) {
    return cb(null, true);
  }
  
  // Check if it's a document
  if (allowedDocumentTypes.test(extname) && 
      (mimetype.startsWith('application/') || mimetype.startsWith('text/'))) {
    return cb(null, true);
  }
  
  cb(new Error('Tipo di file non supportato. Solo immagini (jpg, png, gif, webp) e documenti (pdf, doc, docx, txt) sono permessi.'));
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 5 // Max 5 files per request
  }
});

// Middleware for different upload scenarios
export const uploadSingle = (fieldName: string) => upload.single(fieldName);
export const uploadMultiple = (fieldName: string, maxCount: number = 5) => upload.array(fieldName, maxCount);
export const uploadFields = (fields: { name: string; maxCount?: number }[]) => upload.fields(fields);

// Utility functions
export function deleteFile(filePath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    fs.unlink(filePath, (err) => {
      if (err && err.code !== 'ENOENT') {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

export function getFileUrl(req: any, filePath: string): string {
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  return `${baseUrl}/uploads/${path.relative(uploadsDir, filePath)}`;
}

export function validateFileSize(file: any, maxSizeMB: number): boolean {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxSizeBytes;
}

export function getFileExtension(filename: string): string {
  return path.extname(filename).toLowerCase();
}

export function isImageFile(filename: string): boolean {
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
  return imageExtensions.includes(getFileExtension(filename));
}

export function isDocumentFile(filename: string): boolean {
  const documentExtensions = ['.pdf', '.doc', '.docx', '.txt'];
  return documentExtensions.includes(getFileExtension(filename));
}

// Error handling middleware
export function handleUploadError(error: any, req: any, res: any, next: any) {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ 
        message: 'File troppo grande. Dimensione massima: 10MB' 
      });
    } else if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ 
        message: 'Troppi file. Massimo 5 file per richiesta' 
      });
    } else if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({ 
        message: 'Campo file non previsto' 
      });
    }
  }
  
  return res.status(400).json({ 
    message: error.message || 'Errore nel caricamento del file' 
  });
}
