#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });
const crypto = require('crypto');
const fs = require('fs');

const algorithm = 'aes-256-cbc';

const secretsFile = 'env.secrets.json';
const encryptedFile = 'env.encrypted.json';

function printUsage() {
    console.log('Usage:');
    console.log('  node env-crypto-tool.js genkey');
    console.log('  node env-crypto-tool.js encrypt [passphrase]');
    console.log('  node env-crypto-tool.js decrypt [passphrase]');
    console.log(
        'If [passphrase] is not provided, the tool will try to use the key from the .env.local file (process.env.ENV_SECRET_KEY).',
    );
    process.exit(1);
}

if (process.argv.length < 3) {
    printUsage();
}

const command = process.argv[2];

if (command === 'genkey') {
    const newKey = crypto.randomBytes(32).toString('hex');
    console.log(newKey);
    process.exit(0);
}

let passphrase = process.argv[3] || process.env.ENV_SECRET_KEY;
if (!passphrase) {
    console.error('A passphrase is required, either as a command-line argument or from .env.local (ENV_SECRET_KEY).');
    printUsage();
}

const key = crypto.createHash('sha256').update(passphrase).digest();

function encryptText(text) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return { iv: iv.toString('hex'), encryptedData: encrypted };
}

function decryptText(encryptedObject) {
    const iv = Buffer.from(encryptedObject.iv, 'hex');
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    let decrypted = decipher.update(encryptedObject.encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}

if (command === 'encrypt') {
    try {
        const data = fs.readFileSync(secretsFile, 'utf8');
        const encryptedObject = encryptText(data);
        fs.writeFileSync(encryptedFile, JSON.stringify(encryptedObject, null, 2));
        console.log(`Encryption successful. Encrypted file: ${encryptedFile}`);
    } catch (err) {
        console.error('Encryption error:', err.message);
        process.exit(1);
    }
} else if (command === 'decrypt') {
    try {
        const encryptedContent = JSON.parse(fs.readFileSync(encryptedFile, 'utf8'));
        const decryptedData = decryptText(encryptedContent);
        fs.writeFileSync(secretsFile, decryptedData, 'utf8');
        console.log(`Decryption successful. Decrypted secrets written to: ${secretsFile}`);
    } catch (err) {
        console.error('Decryption error:', err.message);
        process.exit(1);
    }
} else {
    printUsage();
}
