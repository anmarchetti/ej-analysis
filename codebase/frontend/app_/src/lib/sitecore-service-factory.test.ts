import cache from 'memory-cache';

import { sitecoreUrls } from 'code/sitecoreUrls';
import AxiosRequest from 'frontend/utils/request';
import SiteSettings from 'models/enum/SiteSettings';

import { TServerSidePageContext } from './page-props';
import { RestSitecoreService } from './sitecore-service-factory';

const SETTINGS_URL = 'https://sitecore.test/api/sitesettings';

const createContext = (cookieHeader?: string, cookies: Record<string, string> = {}): TServerSidePageContext =>
    ({
        req: {
            headers: cookieHeader ? { cookie: cookieHeader } : {},
            cookies,
        },
        res: {
            locals: {},
        },
    } as TServerSidePageContext);

const createService = (context: TServerSidePageContext): RestSitecoreService => {
    const service = new RestSitecoreService(context);
    service.isCacheEnabled = true;
    service.shortCacheTimeout = 60_000;

    return service;
};

const buildSettings = (enabled: string, experiments: unknown, extra: Record<string, unknown> = {}) => [
    { [SiteSettings.IsOptimizelyExperimentationEnabled]: enabled },
    { [SiteSettings.SiteSettingsExperiments]: experiments },
    extra,
];

describe('RestSitecoreService.fetchApplicationSettings', () => {
    beforeEach(() => {
        cache.clear();
        jest.restoreAllMocks();
        RestSitecoreService.resetApplicationSettingsCachesForTests();
        RestSitecoreService.setPersonalizedSettingsCacheLimitForTests(2000);
        jest.spyOn(sitecoreUrls, 'settings').mockReturnValue(SETTINGS_URL);
    });

    afterEach(() => {
        cache.clear();
        RestSitecoreService.resetApplicationSettingsCachesForTests();
    });

    it('should use global cache for all users when experiments are disabled', async () => {
        const settings = buildSettings('0', 'exp_a', { Shared: 'global' });
        const axiosGetSpy = jest.spyOn(AxiosRequest, 'get').mockResolvedValue({ data: settings } as any);
        const userAService = createService(
            createContext('optimizelyEndUserId=userA', { optimizelyEndUserId: 'userA' }),
        );
        const userBService = createService(
            createContext('optimizelyEndUserId=userB', { optimizelyEndUserId: 'userB' }),
        );

        const firstResponse = await userAService.fetchApplicationSettings('en', true);
        const secondResponse = await userBService.fetchApplicationSettings('en', true);

        expect(firstResponse).toEqual(settings);
        expect(secondResponse).toEqual(settings);
        expect(axiosGetSpy).toHaveBeenCalledTimes(1);
    });

    it('should use per-user cache when experiments are enabled with non-empty SiteSettingsExperiments', async () => {
        const userASettings = buildSettings('1', 'exp_a', { CacheOwner: 'userA' });
        const userBSettings = buildSettings('1', 'exp_a', { CacheOwner: 'userB' });
        const axiosGetSpy = jest
            .spyOn(AxiosRequest, 'get')
            .mockResolvedValueOnce({ data: userASettings } as any)
            .mockResolvedValueOnce({ data: userBSettings } as any);
        const userAService = createService(
            createContext('optimizelyEndUserId=userA', { optimizelyEndUserId: 'userA' }),
        );
        const userBService = createService(
            createContext('optimizelyEndUserId=userB', { optimizelyEndUserId: 'userB' }),
        );

        const firstUserAResponse = await userAService.fetchApplicationSettings('en', true);
        const secondUserAResponse = await userAService.fetchApplicationSettings('en', true);
        const userBResponse = await userBService.fetchApplicationSettings('en', true);

        expect(firstUserAResponse).toEqual(userASettings);
        expect(secondUserAResponse).toEqual(userASettings);
        expect(userBResponse).toEqual(userBSettings);
        expect(axiosGetSpy).toHaveBeenCalledTimes(2);
    });

    it('should treat non-string SiteSettingsExperiments as non-personalized and keep global cache', async () => {
        const settings = buildSettings('1', ['exp_a'], { Shared: 'global' });
        const axiosGetSpy = jest.spyOn(AxiosRequest, 'get').mockResolvedValue({ data: settings } as any);
        const userAService = createService(
            createContext('optimizelyEndUserId=userA', { optimizelyEndUserId: 'userA' }),
        );
        const userBService = createService(
            createContext('optimizelyEndUserId=userB', { optimizelyEndUserId: 'userB' }),
        );

        await userAService.fetchApplicationSettings('en', true);
        await userBService.fetchApplicationSettings('en', true);

        expect(axiosGetSpy).toHaveBeenCalledTimes(1);
    });

    it('should treat empty SiteSettingsExperiments string as non-personalized and keep global cache', async () => {
        const settings = buildSettings('1', '', { Shared: 'global' });
        const axiosGetSpy = jest.spyOn(AxiosRequest, 'get').mockResolvedValue({ data: settings } as any);
        const userAService = createService(
            createContext('optimizelyEndUserId=userA', { optimizelyEndUserId: 'userA' }),
        );
        const userBService = createService(
            createContext('optimizelyEndUserId=userB', { optimizelyEndUserId: 'userB' }),
        );

        await userAService.fetchApplicationSettings('en', true);
        await userBService.fetchApplicationSettings('en', true);

        expect(axiosGetSpy).toHaveBeenCalledTimes(1);
    });

    it('should return null on fetch error and should not poison cache mode', async () => {
        const settings = buildSettings('0', 'exp_a', { Shared: 'global' });
        const axiosGetSpy = jest
            .spyOn(AxiosRequest, 'get')
            .mockRejectedValueOnce(new Error('sitecore failed'))
            .mockResolvedValueOnce({ data: settings } as any);
        const service = createService(createContext('optimizelyEndUserId=userA', { optimizelyEndUserId: 'userA' }));

        const failedResponse = await service.fetchApplicationSettings('en', true);
        const successfulResponse = await service.fetchApplicationSettings('en', true);

        expect(failedResponse).toBeNull();
        expect(successfulResponse).toEqual(settings);
        expect(axiosGetSpy).toHaveBeenCalledTimes(2);
    });

    it('should deduplicate concurrent in-flight requests for the same user key', async () => {
        const settings = buildSettings('0', 'exp_a', { Shared: 'global' });
        const axiosGetSpy = jest.spyOn(AxiosRequest, 'get').mockImplementation(
            () =>
                new Promise(resolve => {
                    setTimeout(() => resolve({ data: settings } as any), 10);
                }),
        );
        const service = createService(createContext('optimizelyEndUserId=userA', { optimizelyEndUserId: 'userA' }));

        const [firstResponse, secondResponse] = await Promise.all([
            service.fetchApplicationSettings('en', true),
            service.fetchApplicationSettings('en', true),
        ]);

        expect(firstResponse).toEqual(settings);
        expect(secondResponse).toEqual(settings);
        expect(axiosGetSpy).toHaveBeenCalledTimes(1);
    });

    it('should evict least recently used personalized cache entries when max size is exceeded', async () => {
        RestSitecoreService.setPersonalizedSettingsCacheLimitForTests(2);

        const axiosGetSpy = jest.spyOn(AxiosRequest, 'get').mockImplementation((_, config) => {
            const cookie = `${config?.headers?.cookie ?? ''}`;
            const match = cookie.match(/optimizelyEndUserId=([^;]+)/);
            const user = match?.[1] ?? 'anonymous';

            return Promise.resolve({ data: buildSettings('1', 'exp_a', { CacheOwner: user }) } as any);
        });

        const userAService = createService(
            createContext('optimizelyEndUserId=userA', { optimizelyEndUserId: 'userA' }),
        );
        const userBService = createService(
            createContext('optimizelyEndUserId=userB', { optimizelyEndUserId: 'userB' }),
        );
        const userCService = createService(
            createContext('optimizelyEndUserId=userC', { optimizelyEndUserId: 'userC' }),
        );

        await userAService.fetchApplicationSettings('en', true);
        await userBService.fetchApplicationSettings('en', true);
        await userCService.fetchApplicationSettings('en', true);
        await userAService.fetchApplicationSettings('en', true);

        expect(axiosGetSpy).toHaveBeenCalledTimes(4);
    });
});
