import { action, computed, makeObservable, observable, runInAction, toJS } from 'mobx';

import settings from 'code/settings';
import mediaCenterService from 'frontend/services/mediaCenter.service';
import { HolidaysRootStore } from 'frontend/store/holidays/HolidaysRootStore';
import { ISssrStore } from 'frontend/store/IStores';
import { formatDateL10n } from 'frontend/utils/date.utils';
import { compare } from 'frontend/utils/sort.utils';
import { IArticle } from 'models/data/IArticle';
import { IFilterOption, IFilters, ISelectedFilter } from 'models/data/IFilters';
import { DataStatus } from 'models/enum/DataStatus';
import { FilterGroupCodes } from 'models/enum/FilterGroupCodes';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

interface IMediaCenterStoreInitialState {
    page: number;
    selectedFilters: ISelectedFilter[];
}

interface IPredefinedTimePeriod {
    key: SitecoreDictionary;
    value: number;
}

export const MIN_ARTICLE_DATE = new Date(2020, 0, 1); // TODO: remove after adding min_article_date to backend

export class MediaCenterStore implements ISssrStore<IMediaCenterStoreInitialState> {
    serialize(): IMediaCenterStoreInitialState {
        return {
            selectedFilters: toJS(this.selectedFilters),
            page: this.page,
        };
    }

    deserialize(initialState?: IMediaCenterStoreInitialState): void {
        if (initialState) {
            this.selectedFilters = initialState.selectedFilters || [];
            this.page = initialState.page;
        }
    }

    @observable public filters: IFilters[] = [];
    @observable public activeFilterCode: FilterGroupCodes = FilterGroupCodes.NoFilter;
    @observable public articles: IArticle[] = [];
    @observable public numberOfArticles: number = 0;
    @observable public selectedFilters: ISelectedFilter[] = [];
    @observable public isFiltersLoaded: boolean = false;
    @observable public page: number = 1;
    @observable status: DataStatus = DataStatus.NotLoaded;
    @observable public latestNews: IArticle[] = [];
    @observable public isLoadingLatestNews: boolean = false;
    @observable public isApplyDisabled: boolean = true;

    @observable public activePredefinedTimePeriod: IPredefinedTimePeriod | undefined;
    @observable public datePickerFromState: Date | undefined;
    @observable public datePickerToState: Date | undefined;
    @observable public maxDateFrom: Date | undefined;
    @observable public minDateTo: Date | undefined;

    /**
     * Creates hardcoded filters
     *
     * @param rootStore
     */
    constructor(public rootStore: HolidaysRootStore) {
        makeObservable(this);
    }

    /**
     * Checks that filter exists
     */
    public isFilterSelected = (filter: IFilterOption): boolean => this.findSelectedFilterIndex(filter) > -1;

    /**
     * Checks if filter group is disabled
     */
    public isFilterGroupDisabled = (filters: IFilters): boolean => {
        if (!filters.options?.length) {
            return true;
        }

        return !filters.options.some(el => el.count > 0);
    };

    /**
     * Sets filters as selected
     */
    @action onSelectFilters = (filters?: IFilterOption) => {
        if (!filters?.groupCode) {
            return;
        }

        const filtersIndex = this.findSelectedFilterIndex(filters);

        if (filtersIndex > -1) {
            this.selectedFilters.splice(filtersIndex, 1);
        } else {
            this.addSelectedFilter(filters);
        }

        this.selectedFilters = [...this.selectedFilters];

        this.rootStore.routerStore.updateCurrentPage(this.rootStore.queryParamsStore.buildMediaCenterFiltersQuery());
    };

    /**
     * Toggles filter as active
     */
    @action onSelectFilterGroup = (filterCode: FilterGroupCodes) => {
        this.activeFilterCode = this.activeFilterCode !== filterCode ? filterCode : FilterGroupCodes.NoFilter;
    };

    @action onRemoveSelectedFilter = (filterGroupCode: string, filterCode: string) => {
        const filterIndexToRemove = this.selectedFilters.findIndex(
            el => el.code === filterCode && el.groupCode === filterGroupCode,
        );

        if (filterIndexToRemove > -1) {
            this.selectedFilters.splice(filterIndexToRemove, 1);
        }

        if (filterGroupCode === FilterGroupCodes.Date) {
            this.resetDateFilters();
        }

        this.rootStore.routerStore.updateCurrentPage(this.rootStore.queryParamsStore.buildMediaCenterFiltersQuery());
    };

    /**
     * Resets active filter
     */
    @action onCloseFilters = () => (this.activeFilterCode = FilterGroupCodes.NoFilter);

    /**
     * Clears filters by group code
     */
    @action onClearSelectedFilters = (filterGroupCode: FilterGroupCodes) => {
        this.selectedFilters = this.selectedFilters.filter(el => el.groupCode !== filterGroupCode);
    };

    @action onClearDatesFilter = () => {
        this.onClearSelectedFilters(FilterGroupCodes.Date);
        this.resetDateFilters();
        this.fetchArticles(true);
    };

    /**
     * Clears all  filters
     */
    @action onClearAllSelectedFilters = () => {
        this.selectedFilters = [];
        this.resetDateFilters();
        this.fetchArticles(true);
    };

    /**
     * Get number of articles to take
     */
    @computed get articlesNumberToTake(): number {
        return this.page > 1 ? settings.MediaCenter.itemsPerPage : settings.MediaCenter.itemsPerFirstPage;
    }

    /**
     * Get number of pages in pagination according to different number of items to show
     */
    @computed get numberOfPages(): number {
        return (
            Math.ceil(
                (this.numberOfArticles - settings.MediaCenter.itemsPerFirstPage) / settings.MediaCenter.itemsPerPage,
            ) + 1
        );
    }

    /**
     * Fetches articles
     */
    @action fetchArticles = async (force: boolean = false): Promise<void> => {
        const shouldLoad =
            force ||
            (this.status !== DataStatus.Loaded &&
                this.status !== DataStatus.Error &&
                this.status !== DataStatus.Loading);

        if (!shouldLoad) {
            return;
        }

        this.status = DataStatus.Loading;

        const data = await mediaCenterService.fetchArticles({
            take: this.articlesNumberToTake,
            page: this.page,
            offset: settings.MediaCenter.itemsPerFirstPage - settings.MediaCenter.itemsPerPage,
            topics: this.topicsFilters,
            startDate: this.maxDateFrom?.toDateString(),
            endDate: this.minDateTo?.toDateString(),
        });

        if (!data) {
            return;
        }

        runInAction(() => {
            this.articles = data.articles;
            this.numberOfArticles = data.total;
            this.status = DataStatus.Loaded;
            this.filters = [
                {
                    code: FilterGroupCodes.Topics,
                    options: data.topicsFilter
                        .map(topic => ({
                            code: topic.name,
                            name: topic.name,
                            count: topic.count,
                            groupCode: FilterGroupCodes.Topics,
                        }))
                        .sort((a, b) => compare(a, b, 'name')),
                    name: FilterGroupCodes.Topics,
                },
                {
                    code: FilterGroupCodes.Date,
                    options: [
                        {
                            code: FilterGroupCodes.Date,
                            name: this.getDatePillName(),
                            count: 1,
                            groupCode: FilterGroupCodes.Date,
                        },
                    ],
                    name: FilterGroupCodes.Date,
                },
            ];
            this.isFiltersLoaded = true;
        });
    };

    /**
     * Date filter set predefined time period
     */
    @action setActivePredefinedTimePeriod = (period?: IPredefinedTimePeriod) => {
        this.activePredefinedTimePeriod = period;

        if (period) {
            const minArticleDate = MIN_ARTICLE_DATE;
            const fromDate = new Date();
            fromDate.setDate(fromDate.getDate() - period.value);

            this.datePickerToState = new Date();
            this.datePickerFromState = fromDate >= minArticleDate ? fromDate : minArticleDate;
            this.onApplyDateFilter();
        } else {
            this.datePickerToState = undefined;
            this.datePickerFromState = undefined;
            this.onRemoveSelectedFilter(FilterGroupCodes.Date, FilterGroupCodes.Date);
            this.fetchArticles(true); // force fetch because results already loaded
        }
    };

    /**
     * Date filter set maxDateFrom
     */
    @action setMaxDateFrom = (date?: Date) => {
        this.maxDateFrom = date;
    };

    /**
     * Date filter set maxDateFrom
     */
    @action setMinDateTo = (date?: Date) => {
        this.minDateTo = date;
    };

    /**
     * Converts date to '01.12.2023' format
     */
    formatDateDMY = (date: Date | string | undefined) => formatDateL10n(date, 'DD.MM.YYYY');

    getDatePillName = () => {
        const { getPhrase } = this.rootStore.layoutStore;

        if (this.activePredefinedTimePeriod) {
            return getPhrase(this.activePredefinedTimePeriod.key);
        }

        if (this.maxDateFrom && this.minDateTo) {
            return `${this.formatDateDMY(this.maxDateFrom)}-${this.formatDateDMY(this.minDateTo)}`;
        }

        if (this.maxDateFrom && !this.minDateTo) {
            return `${getPhrase(SitecoreDictionary.GlobalsLabelsFrom)} ${this.formatDateDMY(this.maxDateFrom)}`;
        }

        if (!this.maxDateFrom && this.minDateTo) {
            return `${getPhrase(SitecoreDictionary.PressHubFiltersLabelsTo)} ${this.formatDateDMY(this.minDateTo)}`;
        }

        return '';
    };

    /**
     * Pagination
     */
    @action setPageNumber = (page: number): void => {
        this.page = page;
    };

    /**
     * Adds filter options to selected
     */
    @action private addSelectedFilter = (filters: IFilterOption) => {
        this.selectedFilters.push({
            code: filters.code,
            name: filters.name,
            groupCode: filters.groupCode!,
            preChecked: filters.preChecked!,
        });
    };

    /**
     * If selected filters empty
     * Populates them with filters from browser query
     */
    @action setFiltersFromQueryParamsStore = (): void => {
        if (this.selectedFilters.length) {
            return;
        }

        if (this.rootStore.queryParamsStore.selectedTopicsFromUrl.length) {
            this.selectedFilters = this.rootStore.queryParamsStore.selectedTopicsFromUrl;
        }
    };

    @action onSelectDatesFilter = () => {
        this.onClearSelectedFilters(FilterGroupCodes.Date);
        this.onSelectFilters({
            code: FilterGroupCodes.Date,
            name: this.getDatePillName(),
            count: 1, // is not used in onSelectFilters(), but is mandatory
            groupCode: FilterGroupCodes.Date,
        });
    };

    /**
     * Redirects to Content Hub page
     *  with filters preset by Date
     */
    @action redirectToArticlesByDate = (): void => {
        this.rootStore.routerStore.redirectToMediaPressReleases();

        this.onSelectDatesFilter();

        this.setPageNumber(1);

        this.fetchArticles(true); // force fetch because results already loaded
    };

    /**
     * Redirects to Press Releases page
     *  with filters preset by Topic
     */
    @action redirectToArticlesByTopic = (topic: string | undefined, url: string): void => {
        this.rootStore.routerStore.redirectTo(url);
        this.onClearSelectedFilters(FilterGroupCodes.Topics);

        if (!!topic) {
            this.onSelectFilters({
                code: topic,
                count: 0, // is not used in onSelectFilters(), but is mandatory
                name: topic,
                groupCode: FilterGroupCodes.Topics,
            });
        }

        this.onCloseFilters(); // force close filter, because it can be uncollapsed
        this.setPageNumber(1);
        this.fetchArticles(true); // force fetch because results already loaded
    };

    /**
     * Change apply button state on filter
     * @param state
     */
    @action setIsApplyDisabledState = (state: boolean): void => {
        this.isApplyDisabled = state;
    };

    /**
     * Change from date in DateFilter component
     * @param dates
     * @param dateStr
     * @param instance
     */
    @action onChangeDatePickerFrom = (dates: Date[]) => {
        this.datePickerFromState = dates[0];

        if (this.activePredefinedTimePeriod) {
            this.activePredefinedTimePeriod = undefined;
            this.onApplyDateFilter();
        }
    };

    @action onChangeDatePickerTo = (dates: Date[]) => {
        this.datePickerToState = dates[0];

        if (this.activePredefinedTimePeriod) {
            this.activePredefinedTimePeriod = undefined;
            this.onApplyDateFilter();
        }
    };

    /**
     * Applies filtering dates and fetchs articles by the range of dates
     * @param needToCloseFilter
     */
    @action onApplyDateFilter = (needToCloseFilter: boolean = true): void => {
        if (
            needToCloseFilter &&
            this.datePickerFromState === this.maxDateFrom &&
            this.datePickerToState === this.minDateTo
        ) {
            this.onCloseFilters();

            return;
        }

        if (this.maxDateFrom === this.datePickerFromState && this.minDateTo === this.datePickerToState) return;

        this.setMaxDateFrom(this.datePickerFromState);
        this.setMinDateTo(this.datePickerToState);
        this.redirectToArticlesByDate();
    };

    @action onCloseDateFilter = (): void => {
        this.datePickerFromState = this.maxDateFrom;
        this.datePickerToState = this.minDateTo;

        if (!this.minDateTo || !this.maxDateFrom) {
            this.activePredefinedTimePeriod = undefined;
        }
    };

    @action resetDateFilters = (): void => {
        this.activePredefinedTimePeriod = undefined;
        this.datePickerFromState = undefined;
        this.datePickerToState = undefined;
        this.maxDateFrom = undefined;
        this.minDateTo = undefined;
    };

    /**
     * Returns index of selected filter option
     */
    private findSelectedFilterIndex = (filter: IFilterOption): number =>
        this.selectedFilters.findIndex(el => el.code === filter.code && el.groupCode === filter.groupCode);

    /**
     * Returns selected filters by filter code
     * @param filterCode
     */
    private getApplyFiltersByCode(filterCode: FilterGroupCodes): Nullable<string[]> {
        if (!this.selectedFilters?.length) {
            return null;
        }

        return this.selectedFilters.filter(el => el.groupCode === filterCode).map(el => el.code);
    }

    /**
     * Checks if there is at least one article
     */
    @computed get hasArticles(): boolean {
        return !!this.articles?.length;
    }

    /**
     * Returns `Topics` Filter
     */
    @computed get topicsFilters(): Nullable<string[]> {
        return this.getApplyFiltersByCode(FilterGroupCodes.Topics);
    }

    /**
     * Returns selected Dates Filters
     */
    @computed get selectedDatesFilters(): ISelectedFilter[] {
        if (!this.selectedFilters?.length) {
            return [];
        }

        return this.selectedFilters.filter(el => el.groupCode === FilterGroupCodes.Date);
    }

    /**
     * Fetch latest articles for LatestNews Component
     */
    @action getLatestNews = async () => {
        if (this.isLoadingLatestNews) {
            return;
        }

        try {
            this.isLoadingLatestNews = true;
            const data = await mediaCenterService.fetchArticles({ take: settings.MediaCenter.numberOfLatestNews });

            runInAction(() => {
                this.latestNews =
                    data?.articles?.length > 0
                        ? data.articles.map((article, idx) => ({
                              ...article,
                              id: `latest-news-article-${idx}`,
                          }))
                        : [];
            });
        } catch (e) {
            runInAction(() => {
                this.latestNews = [];
            });
        } finally {
            runInAction(() => (this.isLoadingLatestNews = false));
        }
    };
}

export default MediaCenterStore;
