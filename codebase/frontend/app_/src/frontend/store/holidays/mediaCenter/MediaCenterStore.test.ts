import settings from 'code/settings';
import mediaCenterService from 'frontend/services/mediaCenter.service';
import { IArticle } from 'models/data/IArticle';
import { ISearchArticles } from 'models/data/ISearchArticles';
import { DataStatus } from 'models/enum/DataStatus';
import { FilterGroupCodes } from 'models/enum/FilterGroupCodes';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import SitePath from 'models/enum/SitePath';

import { MediaCenterStore } from './MediaCenterStore';

jest.mock('frontend/services/mediaCenter.service', () => ({
    fetchArticles: jest.fn(),
}));

jest.mock('frontend/services/logging');

describe('MediaCenterStore', () => {
    describe('Get filters', () => {
        it('should not return filters', () => {
            const store = new MediaCenterStore(null as any);
            expect(store.topicsFilters).toBeNull();
        });

        it('should topicsFilters return string with filter when we have selectedFilters', () => {
            const store = new MediaCenterStore(null as any);
            store.selectedFilters = [
                {
                    code: 'code',
                    groupCode: FilterGroupCodes.Topics,
                    name: 'name',
                },
            ];

            expect(store.topicsFilters).toEqual(['code']);
        });
    });

    describe('Active Filter Group', () => {
        it('should set activeFilterCode correct', () => {
            const store = new MediaCenterStore(null as any);

            expect(store.activeFilterCode).toEqual(FilterGroupCodes.NoFilter);

            store.onSelectFilterGroup(FilterGroupCodes.Topics);

            expect(store.activeFilterCode).toEqual(FilterGroupCodes.Topics);
        });

        it('should set activeFilterCode noFilter when we select same group', () => {
            const store = new MediaCenterStore(null as any);
            store.activeFilterCode = FilterGroupCodes.Topics;

            expect(store.activeFilterCode).toEqual(FilterGroupCodes.Topics);

            store.onSelectFilterGroup(FilterGroupCodes.Topics);

            expect(store.activeFilterCode).toEqual(FilterGroupCodes.NoFilter);
        });

        it('should set activeFilterCode noFilter when we call onCloseFilters', () => {
            const store = new MediaCenterStore(null as any);
            store.activeFilterCode = FilterGroupCodes.Topics;

            expect(store.activeFilterCode).toEqual(FilterGroupCodes.Topics);

            store.onCloseFilters();

            expect(store.activeFilterCode).toEqual(FilterGroupCodes.NoFilter);
        });
    });

    describe('Selected filters', () => {
        it('should set [] selectedFilters when we call onClearAllSelectedFilters', () => {
            const store = new MediaCenterStore(null as any);

            store.selectedFilters = [
                {
                    code: 'code',
                    name: 'name',
                    groupCode: FilterGroupCodes.Topics,
                },
            ];

            store.onClearAllSelectedFilters();

            expect(store.selectedFilters).toEqual([]);
        });

        it('should update selectedFilters when we call onRemoveSelectedFilter', () => {
            const store = new MediaCenterStore({
                routerStore: { updateCurrentPage: jest.fn() },
                queryParamsStore: { buildMediaCenterFiltersQuery: jest.fn() },
            } as any);

            store.selectedFilters = [
                {
                    code: 'code',
                    name: 'name',
                    groupCode: FilterGroupCodes.Topics,
                },
            ];

            store.onRemoveSelectedFilter(FilterGroupCodes.Topics, 'code');

            expect(store.selectedFilters).toEqual([]);
        });

        it('should set selectedFilters when we call onSelectFilters', () => {
            const store = new MediaCenterStore({
                routerStore: { updateCurrentPage: jest.fn() },
                queryParamsStore: { buildMediaCenterFiltersQuery: jest.fn() },
            } as any);
            store.selectedFilters = [];

            store.onSelectFilters();

            expect(store.selectedFilters).toEqual([]);
        });

        it('should set selectedFilters when we call onSelectFilters', () => {
            const store = new MediaCenterStore({
                routerStore: { updateCurrentPage: jest.fn() },
                queryParamsStore: { buildMediaCenterFiltersQuery: jest.fn() },
            } as any);

            store.selectedFilters = [];

            store.onSelectFilters({
                code: 'code',
                count: 2,
                name: 'name',
                groupCode: FilterGroupCodes.Topics,
            });

            expect(store.selectedFilters).toEqual([
                {
                    code: 'code',
                    name: 'name',
                    groupCode: FilterGroupCodes.Topics,
                },
            ]);
        });
    });

    describe('fetchArticles', () => {
        it('should not load articles if status is Loaded', async () => {
            const store = new MediaCenterStore({
                routerStore: { updateCurrentPage: jest.fn() },
                queryParamsStore: { buildMediaCenterFiltersQuery: jest.fn() },
                layoutStore: { getPhrase: jest.fn() },
            } as any);
            store.status = DataStatus.Loaded;
            mediaCenterService.fetchArticles = jest.fn();

            await store.fetchArticles();

            expect(mediaCenterService.fetchArticles).not.toBeCalled();
        });

        it('should not load articles if status is Error', async () => {
            const store = new MediaCenterStore({
                routerStore: {
                    updateCurrentPage: jest.fn(),
                },
                layoutStore: { getPhrase: jest.fn() },
            } as any);
            store.status = DataStatus.Error;
            mediaCenterService.fetchArticles = jest.fn();

            await store.fetchArticles();

            expect(mediaCenterService.fetchArticles).not.toBeCalled();
        });

        it('should load articles', async () => {
            const store = new MediaCenterStore({
                routerStore: {
                    updateCurrentPage: jest.fn(),
                },
                layoutStore: { getPhrase: jest.fn() },
            } as any);
            const total = 10;
            const publicationDate = 'test';
            const articles = [
                {
                    image: 'image',
                    title: 'title',
                    shortDescription: 'shortDescription',
                    url: 'url',
                    publicationDate,
                    topics: ['test', 'test2'],
                } as IArticle,
            ];
            const topicsFilter = [{ code: 'test3', count: 2, name: 'test3', groupCode: FilterGroupCodes.Topics }];
            const dateFilter = [{ code: 'date', count: 1, name: '', groupCode: FilterGroupCodes.Date }];

            const articlesMock = {
                articles,
                total,
                topicsFilter,
            } as ISearchArticles;
            mediaCenterService.fetchArticles = jest.fn().mockReturnValue(Promise.resolve(articlesMock));

            const promise = store.fetchArticles();
            expect(store.status).toEqual(DataStatus.Loading);

            await promise;

            expect(mediaCenterService.fetchArticles).toBeCalled();
            expect(store.status).toEqual(DataStatus.Loaded);
            expect(store.filters).toEqual([
                {
                    code: FilterGroupCodes.Topics,
                    options: topicsFilter,
                    name: FilterGroupCodes.Topics,
                },
                {
                    code: FilterGroupCodes.Date,
                    options: dateFilter,
                    name: FilterGroupCodes.Date,
                },
            ]);
            expect(store.articles).toEqual(articles);
            expect(store.numberOfArticles).toEqual(total);
        });
    });

    it('should redirectToArticlesByTopic', async () => {
        const topicName = 'test';
        const store = new MediaCenterStore({
            routerStore: {
                updateCurrentPage: jest.fn(),
                redirectTo: jest.fn(),
            },
            queryParamsStore: { buildMediaCenterFiltersQuery: jest.fn() },
            layoutStore: { getPhrase: jest.fn() },
        } as any);
        store.redirectToArticlesByTopic(topicName, SitePath.PressReleases);

        expect(store.rootStore.routerStore.redirectTo).toBeCalledWith(SitePath.PressReleases);
        expect(store.selectedFilters).toEqual([
            {
                code: topicName,
                groupCode: FilterGroupCodes.Topics,
                name: topicName,
                preChecked: undefined,
            },
        ]);
        expect(store.page).toEqual(1);
    });

    describe('getLatestNews', () => {
        it('should not load latest news if trey are already loading', async () => {
            const store = new MediaCenterStore(null as any);
            store.isLoadingLatestNews = true;
            mediaCenterService.fetchArticles = jest.fn();

            await store.getLatestNews();

            expect(mediaCenterService.fetchArticles).not.toBeCalled();
        });

        it('should load latest news', async () => {
            const store = new MediaCenterStore(null as any);
            const articlesMock: ISearchArticles = {
                articles: [{}, {}, {}, {}] as any,
                total: 100,
                topicsFilter: [],
            };
            mediaCenterService.fetchArticles = jest.fn().mockResolvedValue(articlesMock);

            await store.getLatestNews();

            expect(mediaCenterService.fetchArticles).toBeCalledWith({ take: settings.MediaCenter.numberOfLatestNews });
            expect(store.latestNews).toHaveLength(articlesMock.articles.length);
        });
    });

    it('should redirectToArticlesByDate', async () => {
        const store = new MediaCenterStore({
            routerStore: {
                updateCurrentPage: jest.fn(),
                redirectToMediaPressReleases: jest.fn(),
            },
            queryParamsStore: { buildMediaCenterFiltersQuery: jest.fn() },
            layoutStore: { getPhrase: jest.fn() },
            onSelectDatesFilter: jest.fn(),
        } as any);
        store.redirectToArticlesByDate();

        expect(store.rootStore.routerStore.redirectToMediaPressReleases).toBeCalled();
        expect(store.selectedFilters).toEqual([
            {
                code: FilterGroupCodes.Date,
                name: store.getDatePillName(),
                groupCode: FilterGroupCodes.Date,
                preChecked: undefined,
            },
        ]);
        expect(store.page).toEqual(1);
        expect(store.rootStore.queryParamsStore.buildMediaCenterFiltersQuery).toBeCalled();
    });

    describe('dates filter', () => {
        it('should change datePickerFromState', () => {
            const store = new MediaCenterStore(null as any);
            const fromDate = new Date(2020, 1, 10);
            mediaCenterService.fetchArticles = jest.fn();

            store.onChangeDatePickerFrom([fromDate]);
            expect(store.datePickerFromState).toEqual(fromDate);
            expect(mediaCenterService.fetchArticles).not.toBeCalled();
        });

        it('should change datePickerToState', () => {
            const store = new MediaCenterStore(null as any);
            const toDate = new Date(2020, 7, 12);
            mediaCenterService.fetchArticles = jest.fn();

            store.onChangeDatePickerTo([toDate]);
            expect(store.datePickerToState).toEqual(toDate);
            expect(mediaCenterService.fetchArticles).not.toBeCalled();
        });

        it('should change datePickerFromState and refresh data when predefined period was active', async () => {
            const store = new MediaCenterStore({
                routerStore: {
                    updateCurrentPage: jest.fn(),
                    redirectToMediaPressReleases: jest.fn(),
                },
                queryParamsStore: { buildMediaCenterFiltersQuery: jest.fn() },
                layoutStore: { getPhrase: jest.fn() },
            } as any);
            const fromDate = new Date(2020, 1, 10);
            store.activePredefinedTimePeriod = {
                key: SitecoreDictionary.PressHubFiltersPredefinedTimePeriodsLastThreeMonths,
                value: 90,
            };
            mediaCenterService.fetchArticles = jest.fn();

            store.onChangeDatePickerFrom([fromDate]);
            store.onApplyDateFilter();
            expect(mediaCenterService.fetchArticles).toBeCalled();
        });

        it('should change datePickerToState and refresh data when predefined period was active', async () => {
            const store = new MediaCenterStore({
                routerStore: {
                    updateCurrentPage: jest.fn(),
                    redirectToMediaPressReleases: jest.fn(),
                },
                queryParamsStore: { buildMediaCenterFiltersQuery: jest.fn() },
                layoutStore: { getPhrase: jest.fn() },
            } as any);
            const toDate = new Date(2020, 7, 12);
            store.activePredefinedTimePeriod = {
                key: SitecoreDictionary.PressHubFiltersPredefinedTimePeriodsLastThreeMonths,
                value: 90,
            };
            mediaCenterService.fetchArticles = jest.fn();

            store.onChangeDatePickerTo([toDate]);
            expect(store.datePickerToState).toEqual(toDate);
            expect(mediaCenterService.fetchArticles).toBeCalled();
        });

        it('should setActivePredefinedTimePeriod', () => {
            const predefinedPeriod = {
                key: SitecoreDictionary.PressHubFiltersPredefinedTimePeriodsLastThreeMonths,
                value: 90,
            };

            const store = new MediaCenterStore({
                routerStore: {
                    updateCurrentPage: jest.fn(),
                    redirectToMediaPressReleases: jest.fn(),
                },
                queryParamsStore: { buildMediaCenterFiltersQuery: jest.fn() },
                layoutStore: { getPhrase: jest.fn() },
            } as any);
            mediaCenterService.fetchArticles = jest.fn();
            store.setActivePredefinedTimePeriod(predefinedPeriod);

            expect(store.activePredefinedTimePeriod).toEqual(predefinedPeriod);
            expect(mediaCenterService.fetchArticles).toBeCalled();
        });

        it('should resetDateFilters', () => {
            const store = new MediaCenterStore(null as any);
            store.resetDateFilters();

            expect(store.activePredefinedTimePeriod).toBeUndefined();
            expect(store.datePickerFromState).toBeUndefined();
            expect(store.datePickerToState).toBeUndefined();
            expect(store.maxDateFrom).toBeUndefined();
            expect(store.minDateTo).toBeUndefined();
        });

        it('should set minDateTo and maxDateFrom onCloseDateFilter', () => {
            const store = new MediaCenterStore(null as any);
            const maxDateFrom = new Date(2020, 10, 11);
            const minDateTo = new Date(2021, 1, 8);

            store.maxDateFrom = maxDateFrom;
            store.minDateTo = minDateTo;
            store.onCloseDateFilter();

            expect(store.datePickerFromState).toEqual(maxDateFrom);
            expect(store.datePickerToState).toEqual(minDateTo);
        });
    });
});
