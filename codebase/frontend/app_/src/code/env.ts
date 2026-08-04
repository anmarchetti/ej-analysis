import isBackend from 'frontend/utils/isBackend';

let env: any;

const getEnv = () => {
    if (!env) {
        if (isBackend()) {
            /* istanbul ignore next */
            if (process.env.NEXT_ENV) {
                env = JSON.parse(process.env.NEXT_ENV);
            }
        } else {
            env = window['NEXT_ENV'];
        }
    }

    return env ?? {};
};

export const getEnvAll = (): IENVALL => {
    const envData = getEnv();

    return {
        ...envData,
        ...(envData.public || {}),
        ...(envData.private || {}),
    };
};

export const getPublicEnv = (): IENVPUBLIC => {
    const envData = getEnv();

    return isBackend() ? { ...envData.public } : envData;
};

export const envPublic = getPublicEnv();
export const envAll = getEnvAll();
