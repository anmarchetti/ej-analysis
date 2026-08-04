const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawnSync } = require('child_process');

describe('env-crypto-tool CLI', () => {
    const cliPath = path.resolve(__dirname, 'env-crypto-tool.js');
    let tmpDir;
    let originalDir;

    const secretsFile = 'env.secrets.json';
    const encryptedFile = 'env.encrypted.json';

    const testPassphrase = 'testpass';

    beforeEach(() => {
        originalDir = process.cwd();
        tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'env-crypto-tool-test-'));
        process.chdir(tmpDir);

        fs.writeFileSync(secretsFile, '{"secret": "This is a test"}', 'utf8');

        fs.writeFileSync('.env.local', `ENV_SECRET_KEY=${testPassphrase}`, 'utf8');
    });

    afterEach(() => {
        process.chdir(originalDir);
        fs.rmSync(tmpDir, { recursive: true, force: true });
    });

    test('genkey command generates a valid random key', () => {
        const result = spawnSync('node', [cliPath, 'genkey']);
        expect(result.status).toBe(0);
        const key = result.stdout.toString().trim();
        expect(key).toMatch(/^[0-9a-fA-F]{64}$/);
    });

    test('encrypt and decrypt work correctly using CLI passphrase', () => {
        let result = spawnSync('node', [cliPath, 'encrypt', testPassphrase]);
        expect(result.status).toBe(0);
        expect(result.stdout.toString()).toMatch(/Encryption successful/);
        expect(fs.existsSync(encryptedFile)).toBe(true);

        result = spawnSync('node', [cliPath, 'decrypt', testPassphrase]);
        expect(result.status).toBe(0);
        expect(result.stdout.toString()).toMatch(/Decryption successful/);
        const decryptedContent = fs.readFileSync(secretsFile, 'utf8');
        expect(decryptedContent).toBe('{"secret": "This is a test"}');
    });

    test('encrypt and decrypt work correctly using environment variable', () => {
        let result = spawnSync('node', [cliPath, 'encrypt']);
        expect(result.status).toBe(0);
        expect(result.stdout.toString()).toMatch(/Encryption successful/);
        expect(fs.existsSync(encryptedFile)).toBe(true);

        result = spawnSync('node', [cliPath, 'decrypt']);
        expect(result.status).toBe(0);
        expect(result.stdout.toString()).toMatch(/Decryption successful/);
        const decryptedContent = fs.readFileSync(secretsFile, 'utf8');
        expect(decryptedContent).toBe('{"secret": "This is a test"}');
    });
});
