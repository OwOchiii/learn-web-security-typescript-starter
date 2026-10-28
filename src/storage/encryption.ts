import { createCipheriv, randomBytes, createDecipheriv } from "node:crypto";

export type EncryptedPayload = {
  nonce: Buffer;
  authTag: Buffer;
  ciphertext: Buffer;
};

export function validateKey(key: Buffer): void {
    if (key.length !== 32) {
        throw new Error('Invalid key length. Key must be 32 bytes long.');
    }
}

export function validatePayload(payload: EncryptedPayload): void {
    if (!Buffer.isBuffer(payload.nonce)) {
        throw new Error('Invalid nonce. Must be a Buffer.');
    }
    if (payload.nonce.length !== 12) {
        throw new Error('Invalid nonce length. Must be 12 bytes long.');
    }
    if (!Buffer.isBuffer(payload.authTag)) {
        throw new Error('Invalid authTag. Must be a Buffer.');
    }
    if (payload.authTag.length !== 16) {
        throw new Error('Invalid authTag length. Must be 16 bytes long.');
    }
    if (!Buffer.isBuffer(payload.ciphertext)) {
        throw new Error('Invalid ciphertext. Must be a Buffer.');
    }
}

export function encrypt(plaintext: Buffer, key: Buffer): EncryptedPayload {
    validateKey(key);
    const nonce = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', key, nonce, { authTagLength: 16 });
    const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
    const authTag = cipher.getAuthTag();
    return { nonce, authTag, ciphertext };
}

export function decrypt(payload: EncryptedPayload, key: Buffer): Buffer {
    validateKey(key);
    validatePayload(payload);
    const { nonce, authTag, ciphertext } = payload;
    const decipher = createDecipheriv('aes-256-gcm', key, nonce, { authTagLength: 16 });
    decipher.setAuthTag(authTag);
    return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
}