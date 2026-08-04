'use strict';

/**
 * Container entrypoint for the dhi.io/node runtime image.
 * There is no shell (/bin/sh) or cp in this image, so EFS config files
 * are copied using Node.js fs, then the backend is started directly with Node.
 */

const { spawn } = require('child_process');
const fs = require('fs');

// Copy runtime config files from the EFS mount.
// Fail fast with a clear message if the mount is not ready.
const configFiles = [
  ['/mnt/efs/env.json', '/app/.next/env.json'],
  ['/mnt/efs/.env.octopus', '/app/.next/.env'],
];

for (const [src, dest] of configFiles) {
  try {
    fs.copyFileSync(src, dest);
  } catch (err) {
    console.error(`startup: failed to copy ${src} -> ${dest}: ${err.message}`);
    process.exit(1);
  }
}

// Start the backend directly (no process manager dependency in runtime image).
const child = spawn(
  'node',
  ['-r', '@splunk/otel/instrument', '/app/.next/backend/index.js'],
  { stdio: 'inherit' }
);

// Forward termination signals to the app process for graceful shutdown.
['SIGTERM', 'SIGINT', 'SIGUSR2'].forEach(sig =>
  process.on(sig, () => child.kill(sig))
);

child.on('exit', (code) => process.exit(code ?? 0));
