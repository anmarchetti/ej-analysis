import fs from 'fs';
import path from 'path';

import { merge } from 'lodash';

export interface IENVSERVER extends IENVALL {
    private: IENVPRIVATE;
    public: IENVPUBLIC;
}

// read env.json file during runtime, allows optional env.local.json overrides
export const getEnv = (): IENVSERVER => {
    const dev = process.env.NODE_ENV !== 'production';
    const envFile = path.resolve(process.cwd(), dev ? 'env.json' : '.next/env.json');
    const envJson = fs.readFileSync(envFile, 'utf8');
    const parsedEnv = JSON.parse(envJson);

    const localEnvOverridesFile = path.resolve(process.cwd(), 'env.local.json');
    const localEnvOverrides = fs.existsSync(localEnvOverridesFile)
        ? JSON.parse(fs.readFileSync(localEnvOverridesFile, 'utf8'))
        : {};

    const secretsEnvOverridesFile = path.resolve(process.cwd(), 'env.secrets.json');
    const secretsEnvOverrides = fs.existsSync(secretsEnvOverridesFile)
        ? JSON.parse(fs.readFileSync(secretsEnvOverridesFile, 'utf8'))
        : {};
    const envPublic = merge({}, parsedEnv.public, secretsEnvOverrides.public, localEnvOverrides.public);
    const envPrivate = merge({}, parsedEnv.private, secretsEnvOverrides.private, localEnvOverrides.private);

    const envObject = {
        public: envPublic,
        private: envPrivate,
        ...envPublic,
        ...envPrivate,
    };

    process.env.NEXT_ENV = JSON.stringify(envObject);

    return envObject;
};
