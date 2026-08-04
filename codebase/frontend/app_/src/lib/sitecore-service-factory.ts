import cache from 'memory-cache';

import { envAll } from 'code/env';
import { sitecoreUrls } from 'code/sitecoreUrls';
import AxiosRequest from 'frontend/utils/request';
import { TAllMarketsSettings } from 'models/data/MarketSettings';
import { ISitecoreTooltipSettings } from 'models/data/PriceTooltip';
import SiteSettings from 'models/enum/SiteSettings';

import { TServerSidePageContext } from './page-props';
import { DEFAULT_CACHE_TIMEOUT_SECONDS } from './page-props-factory';

const DEFAULT_PERSONALIZED_SETTINGS_CACHE_MAX_ENTRIES = 2000;

type TApplicationSettingsCacheMode = 'global' | 'user';

interface IExpiringLruCacheEntry<V> {
    expiresAt: number;
    value: V;
}

class ExpiringLruCache<V> {
    private readonly entries = new Map<string, IExpiringLruCacheEntry<V>>();

    constructor(private readonly maxEntries: number) {}

    clear(): void {
        this.entries.clear();
    }

    get(key: string): Nullable<V> {
        const entry = this.entries.get(key);

        if (!entry) {
            return null;
        }

        if (entry.expiresAt <= Date.now()) {
            this.entries.delete(key);

            return null;
        }

        this.entries.delete(key);
        this.entries.set(key, entry);

        return entry.value;
    }

    set(key: string, value: V, ttlMilliseconds: number): V {
        if (ttlMilliseconds <= 0) {
            return value;
        }

        const entry: IExpiringLruCacheEntry<V> = {
            expiresAt: Date.now() + ttlMilliseconds,
            value,
        };

        if (this.entries.has(key)) {
            this.entries.delete(key);
        }

        this.entries.set(key, entry);
        this.enforceMaxEntries();

        return value;
    }

    private enforceMaxEntries(): void {
        this.removeExpiredHeadEntries();

        while (this.entries.size > this.maxEntries) {
            const oldestKey = this.entries.keys().next().value;

            if (!oldestKey) {
                return;
            }

            this.entries.delete(oldestKey);
        }
    }

    private removeExpiredHeadEntries(): void {
        while (this.entries.size) {
            const oldestEntry = this.entries.entries().next().value;

            if (!oldestEntry) {
                return;
            }

            const [oldestKey, entry] = oldestEntry;

            if (entry.expiresAt > Date.now()) {
                return;
            }

            this.entries.delete(oldestKey);
        }
    }
}

// FIXME: add logger
export class RestSitecoreService {
    private static readonly applicationSettingsRequests = new Map<string, Promise<any>>();
    private static personalizedSettingsCache = new ExpiringLruCache<any>(
        envAll.SITECORE_PERSONALIZED_SETTINGS_CACHE_MAX_ENTRIES ?? DEFAULT_PERSONALIZED_SETTINGS_CACHE_MAX_ENTRIES,
    );

    isCacheEnabled = envAll.ENABLE_SITECORE_CACHE ?? true;

    // short cache 2 min (1 min dev) for settings and dictionary
    shortCacheTimeout = (envAll.CACHE_SHORT_EXPIRE_SECONDS ?? DEFAULT_CACHE_TIMEOUT_SECONDS) * 1000;

    // long cache 30 mins (1 min dev) for price tooltip setting
    longCacheTimeout = (envAll.CACHE_LONG_EXPIRE_SECONDS ?? DEFAULT_CACHE_TIMEOUT_SECONDS) * 1000;

    constructor(private context: TServerSidePageContext) {}

    private get axiosConfig() {
        const { req } = this.context;

        return {
            headers: req?.headers?.cookie ? { cookie: req.headers.cookie } : {},
        };
    }

    async fetchApplicationSettings(lang: string = 'en', isLocale: boolean = false): Promise<any> {
        const url = sitecoreUrls.settings(lang, isLocale);
        const modeCacheKey = this.getApplicationSettingsModeCacheKey(url);
        const globalCacheKey = this.getApplicationSettingsGlobalCacheKey(url);
        const userCacheKey = this.getApplicationSettingsUserCacheKey(url, this.getOptimizelyUserKey());

        const cacheMode = this.getApplicationSettingsCacheMode(modeCacheKey);
        const cachedByMode = this.getCachedApplicationSettings(cacheMode, globalCacheKey, userCacheKey);

        if (cachedByMode) {
            return cachedByMode;
        }

        const requestKey = cacheMode === 'global' ? globalCacheKey : userCacheKey;

        return this.getApplicationSettingsRequest(requestKey, async () => {
            const latestCacheMode = this.getApplicationSettingsCacheMode(modeCacheKey);
            const cachedValue = this.getCachedApplicationSettings(latestCacheMode, globalCacheKey, userCacheKey);

            if (cachedValue) {
                return cachedValue;
            }

            try {
                const result = await AxiosRequest.get(url, this.axiosConfig);
                const shouldUseUserCache = this.hasPersonalizedSettings(result.data);
                const nextMode: TApplicationSettingsCacheMode = shouldUseUserCache ? 'user' : 'global';
                const nextCacheKey = shouldUseUserCache ? userCacheKey : globalCacheKey;

                this.setCacheValue(modeCacheKey, nextMode, this.shortCacheTimeout);

                return this.setApplicationSettingsCacheValue(nextMode, nextCacheKey, result.data);
            } catch (e) {
                return null;
            }
        });
    }

    async fetchPriceTooltipSetting(
        lang: string = 'en',
        isLocale: boolean = false,
    ): Promise<Nullable<ISitecoreTooltipSettings>> {
        const url = sitecoreUrls.priceTooltipSettings(lang, isLocale);

        const cachedValue = this.getCacheValue(url);

        if (cachedValue) {
            return cachedValue;
        }

        try {
            const result = await AxiosRequest.get(url, this.axiosConfig);

            return this.setCacheValue<ISitecoreTooltipSettings>(url, result.data, this.longCacheTimeout);
        } catch {
            return null;
        }
    }

    async fetchMarketSettings(): Promise<Nullable<TAllMarketsSettings>> {
        const url = sitecoreUrls.marketSettings();

        const cachedValue = this.getCacheValue(url);

        if (cachedValue) {
            return cachedValue;
        }

        try {
            const result = await AxiosRequest.get(url, this.axiosConfig);

            return this.setCacheValue<TAllMarketsSettings>(url, result.data, this.longCacheTimeout);
        } catch (e) {
            return null;
        }
    }

    private getCacheValue(key: string) {
        return this.isCacheEnabled ? cache.get(key) : null;
    }

    private getPersonalizedCacheValue<V>(key: string): Nullable<V> {
        return this.isCacheEnabled ? RestSitecoreService.personalizedSettingsCache.get(key) : null;
    }

    private setCacheValue<V>(key: string, value: V, timeout = this.shortCacheTimeout) {
        return this.isCacheEnabled ? cache.put(key, value, timeout) : value;
    }

    private setPersonalizedCacheValue<V>(key: string, value: V, timeout = this.shortCacheTimeout): V {
        return this.isCacheEnabled ? RestSitecoreService.personalizedSettingsCache.set(key, value, timeout) : value;
    }

    static resetApplicationSettingsCachesForTests(): void {
        RestSitecoreService.applicationSettingsRequests.clear();
        RestSitecoreService.personalizedSettingsCache.clear();
    }

    static setPersonalizedSettingsCacheLimitForTests(maxEntries: number): void {
        RestSitecoreService.personalizedSettingsCache = new ExpiringLruCache<Record<string, string>>(maxEntries);
    }

    private getApplicationSettingsRequest(key: string, request: () => Promise<any>) {
        const inFlightRequest = RestSitecoreService.applicationSettingsRequests.get(key);

        if (inFlightRequest) {
            return inFlightRequest;
        }

        const requestPromise = request().finally(() => RestSitecoreService.applicationSettingsRequests.delete(key));

        RestSitecoreService.applicationSettingsRequests.set(key, requestPromise);

        return requestPromise;
    }

    private getCachedApplicationSettings(
        mode: Nullable<TApplicationSettingsCacheMode>,
        globalCacheKey: string,
        userCacheKey: string,
    ) {
        if (mode === 'global') {
            return this.getCacheValue(globalCacheKey);
        }

        if (mode === 'user') {
            return this.getPersonalizedCacheValue(userCacheKey);
        }

        return null;
    }

    private setApplicationSettingsCacheValue(mode: TApplicationSettingsCacheMode, key: string, value: any) {
        if (mode === 'user') {
            return this.setPersonalizedCacheValue(key, value, this.shortCacheTimeout);
        }

        return this.setCacheValue(key, value, this.shortCacheTimeout);
    }

    private getApplicationSettingsCacheMode(modeCacheKey: string): Nullable<TApplicationSettingsCacheMode> {
        const cachedMode = this.getCacheValue(modeCacheKey);

        return cachedMode === 'global' || cachedMode === 'user' ? cachedMode : null;
    }

    private getApplicationSettingsGlobalCacheKey(url: string): string {
        return `settings::${url}`;
    }

    private getApplicationSettingsUserCacheKey(url: string, userKey: string): string {
        return `settings::${url}::user::${userKey}`;
    }

    private getApplicationSettingsModeCacheKey(url: string): string {
        return `settings::${url}::mode`;
    }

    private hasPersonalizedSettings(settings: unknown): boolean {
        const isOptimizelyExperimentationEnabled = this.getSettingValue(
            settings,
            SiteSettings.IsOptimizelyExperimentationEnabled,
        );
        const siteSettingsExperiments = this.getSettingValue(settings, SiteSettings.SiteSettingsExperiments);

        return (
            isOptimizelyExperimentationEnabled === '1' &&
            typeof siteSettingsExperiments === 'string' &&
            siteSettingsExperiments.trim().length > 0
        );
    }

    private getSettingValue(settings: unknown, key: string): unknown {
        if (!Array.isArray(settings)) {
            return undefined;
        }

        for (const setting of settings) {
            if (setting && typeof setting === 'object' && key in setting) {
                return setting[key];
            }
        }

        return undefined;
    }

    private getOptimizelyUserKey(): string {
        const cookieKey = 'optimizelyEndUserId';
        const requestCookieValue = this.context.req?.cookies?.[cookieKey];
        const headerCookieValue = this.getCookieValueFromHeader(cookieKey);
        const cookieValue = requestCookieValue || headerCookieValue;

        return typeof cookieValue === 'string' && cookieValue ? cookieValue : 'anonymous';
    }

    private getCookieValueFromHeader(cookieName: string): Nullable<string> {
        const cookieHeader = this.context.req?.headers?.cookie;

        if (!cookieHeader) {
            return null;
        }

        const cookieChunk = cookieHeader
            .split(';')
            .map(chunk => chunk.trim())
            .find(chunk => chunk.startsWith(`${cookieName}=`));

        if (!cookieChunk) {
            return null;
        }

        const rawValue = cookieChunk.slice(cookieName.length + 1);

        if (!rawValue) {
            return null;
        }

        try {
            return decodeURIComponent(rawValue);
        } catch {
            return rawValue;
        }
    }
}

export class SitecoreServiceFactory {
    create(context: TServerSidePageContext): RestSitecoreService {
        return new RestSitecoreService(context);
    }
}

export const sitecoreServiceFactory = new SitecoreServiceFactory();
