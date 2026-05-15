import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';

const storage = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb) => {
    let subDir = '';
    const memberId = req.body.member_id || req.body.employee_id || req.params.member_id || req.params.employee_id || 'unknown';

    if (req.originalUrl.includes('/medical-certificate')) {
      subDir = path.join('uploads', 'medical-certificates', memberId.toString());
    } else if (req.originalUrl.includes('/document')) {
      subDir = path.join('uploads', 'documents', memberId.toString());
    } else if (req.originalUrl.includes('/avatar')) {
      subDir = path.join('uploads', 'avatars', memberId.toString());
    } else {
      subDir = path.join('uploads', 'migrated');
    }

    const fullPath = path.resolve(process.cwd(), subDir);
    // Create directory if it doesn't exist
    fs.mkdirSync(fullPath, { recursive: true });
    cb(null, fullPath);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = `${uuidv4()}${ext}`;
    cb(null, filename);
  }
});

const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedExtensions = ['.pdf', '.jpg', '.jpeg', '.png', '.heic'];
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type. Allowed: ${allowedExtensions.join(', ')}`));
  }
};

export const uploadConfig = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter
});
