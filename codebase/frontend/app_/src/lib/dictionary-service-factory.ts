import { DictionaryService, RestDictionaryService } from '@sitecore-jss/sitecore-jss-nextjs';

import { envAll } from 'code/env';

import { DEFAULT_CACHE_TIMEOUT_SECONDS } from './page-props-factory';

export class DictionaryServiceFactory {
    create(): DictionaryService {
        return new RestDictionaryService({
            apiHost: envAll.SITECORE_URL,
            apiKey: envAll.SITECORE_API_KEY,
            siteName: envAll.APP_NAME ?? '',
            cacheEnabled: envAll.ENABLE_SITECORE_CACHE ?? true,
            cacheTimeout: envAll.CACHE_SHORT_EXPIRE_SECONDS ?? DEFAULT_CACHE_TIMEOUT_SECONDS,
        });
    }
}

export const dictionaryServiceFactory = new DictionaryServiceFactory();
