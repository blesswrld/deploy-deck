import { Injectable } from '@nestjs/common';
import SimpleCrypto from 'simple-crypto-js';

@Injectable()
export class EncryptionService {
  private crypto: SimpleCrypto;

  constructor() {
    // Используем SECRET_KEY из .env как ключ для шифрования
    const secretKey = process.env.SECRET_KEY;
    if (!secretKey) {
      throw new Error('SECRET_KEY is not defined in .env file');
    }
    this.crypto = new SimpleCrypto(secretKey);
  }

  encrypt(text: string): string {
    return this.crypto.encrypt(text);
  }

  decrypt(encryptedText: string): string {
    return this.crypto.decrypt(encryptedText) as string;
  }
}
