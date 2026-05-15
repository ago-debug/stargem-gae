import jwt from 'jsonwebtoken';
import 'dotenv/config';

export function generateSignedUrl(filePath: string, ttlMinutes: number = 15): string {
  const secret = process.env.JWT_SECRET || 'StargemFallbackSecret2026';
  
  const payload = {
    filePath,
    exp: Math.floor(Date.now() / 1000) + ttlMinutes * 60
  };

  const token = jwt.sign(payload, secret);
  return `https://stargem.studio-gem.it/uploads/${filePath}?token=${token}&exp=${payload.exp}`;
}

export function verifySignedUrlToken(token: string): any {
  const secret = process.env.JWT_SECRET || 'StargemFallbackSecret2026';
  try {
    return jwt.verify(token, secret);
  } catch (error) {
    return null;
  }
}
