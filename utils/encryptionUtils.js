const crypto = require('crypto');

const algorithm = 'aes-256-cbc';
// Use your generated 64-character hex key
const secretKeyHex = '3b81ae8e0831dbfda8d36769c9b0d3e816f51b6ea6bba31a146d3f1b8c3c4d50'; 
if (!secretKeyHex) {
    throw new Error('ENCRYPTION_KEY environment variable is not set');
}
const secretKey = Buffer.from(secretKeyHex, 'hex'); // Use the provided hex key
const ivLength = 16; // For AES, this is always 16

const encrypt = (text) => {
    const iv = crypto.randomBytes(ivLength); // Generate a new IV for each encryption
    const cipher = crypto.createCipheriv(algorithm, secretKey, iv);
    const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
    
    return `${iv.toString('hex')}:${encrypted.toString('hex')}`; // Return encrypted data with IV
};

const decrypt = (hash) => {
    const [ivHex, encryptedText] = hash.split(':');
    const iv = Buffer.from(ivHex, 'hex'); // Extract the IV
    const decipher = crypto.createDecipheriv(algorithm, secretKey, iv);
    const decrypted = Buffer.concat([decipher.update(Buffer.from(encryptedText, 'hex')), decipher.final()]);

    return decrypted.toString('utf8');
};

module.exports = { encrypt, decrypt };
