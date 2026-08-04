import type { ReactSDKClient } from '@optimizely/react-sdk';
import { INestedObject } from '@sitecore/engage/types/lib/utils/flatten-object';
import { LayoutServicePageState } from '@sitecore-jss/sitecore-jss-nextjs';
import { action, computed, makeObservable, observable, runInAction, toJS } from 'mobx';

import { buildBasePathByLang } from 'code/basePath';
import { getCMSLang, getLangByCMSLang, TCmsLang, TSitecoreLangs } from 'code/cmsLang';
import { notificationsUrls } from 'code/endpoints';
import settings from 'code/settings';
import notificationsService from 'frontend/services/notifications.service';
import sitecoreService from 'frontend/services/sitecore.service';
import { ISssrStore, TRootStore } from 'frontend/store/IStores';
import { getSecondLatestOrFirst, splitArray } from 'frontend/utils/array.utils';
import { getCookie, getCookieFromContext } from 'frontend/utils/cookies.utils';
import { fixExpEditorClickEvents } from 'frontend/utils/expEditor.utils';
import { filterOutOverviewGroup } from 'frontend/utils/facilities.utils';
import isBackend from 'frontend/utils/isBackend';
import { localizeDayJS, localizeFlatpickr } from 'frontend/utils/l10n.utils';
import {
    findComponentByName,
    findComponentsByParam,
    getAllPlaceholdersPathsFromParentComponents,
    IComponentWithPlaceholder,
} from 'frontend/utils/layout.utils';
import { isLivePriceEnabledForDestinationPage } from 'frontend/utils/livePrice.utils';
import { getTotalDiscount } from 'frontend/utils/offer.utils';
import { isNavigatorGoBack } from 'frontend/utils/route.utils';
import { sortBy } from 'frontend/utils/sort.utils';
import { parseQuery, purifyUrl } from 'frontend/utils/url.utils';
import { BagsPromotionCode } from 'models/data/BagsPromotionSettings';
import { IBreadcrumb } from 'models/data/IBreadcrumb';
import { IDestination } from 'models/data/IDestination';
import { IFilterOrderSetting } from 'models/data/IFilters';
import { IFacilityGroup } from 'models/data/IHotel';
import { IOffer } from 'models/data/IOffer';
import { ISearchResultsFields } from 'models/data/ISearchResultsFields';
import { IPriceTooltipSetting, IPriceTooltipSitecoreModel } from 'models/data/PriceTooltip';
import { ISitecoreLayout, ISitecoreLayoutContext, ISitecoreLayoutRoute } from 'models/data/SitecoreLayout';
import { CookiesKeys, MobileAppCookieKeys } from 'models/enum/CookiesKeys';
import { ExperimentVariants } from 'models/enum/cro/Experiment';
import { FacilitiesDesignVariant } from 'models/enum/FacilitiesDesignVariant';
import { DEFAULT_FILTER_ORDER, FilterGroupCodes } from 'models/enum/FilterGroupCodes';
import { QueryParamName } from 'models/enum/QueryParamName';
import SitecoreTemplateId from 'models/enum/SitecoreTemplateId';
import { SiteName } from 'models/enum/SiteName';
import SitePath, {
    SitePathDictionaryBreadcrumb,
    SitePathDictionaryBreadcrumbOverload,
    SitePathOverload,
} from 'models/enum/SitePath';
import SiteSettings from 'models/enum/SiteSettings';
import { ITimeUnitConfig } from 'models/enum/TimeUnitsDictionary';
import TradePortalSitecoreTemplateId from 'models/enum/tradePortal/TradePortalSitecoreTemplateId';
import { TViewBookingRedirectsPaths } from 'models/enum/ViewBookingPageStates';
import { IOptimizelyDecision } from 'models/optimizely';
import { OptimizelyDecisionSource } from 'models/optimizely/OptimizelyDecision';
import { ISitecoreField, ISitecoreSettingsLink } from 'models/sitecore/generic/ISitecoreField';
import { ISitecoreDictionary } from 'models/sitecore/ISitecoreDictionary';

export interface ILayoutInitialState {
    basePath?: string;
    cookies?: string;
    currentPath?: string;
    dateLocale?: string;
    dictionary?: ISitecoreDictionary;
    domain?: Nullable<string>;
    fullUrl?: string;
    isMobileDeviceDetectedDuringSSR?: boolean;
    lang?: TSitecoreLangs;
    layout?: ISitecoreLayout;
    protocol?: string;
    referrer?: Nullable<string>;
    settings?: any;
    tooltipSettings?: Nullable<IPriceTooltipSetting[]>;
}

const CHUNK_SIZE = 5;
export const FORCE_RELOAD_PARAM_NAME = 'ForceReloadChildren';

export class BaseLayoutStore implements ISssrStore<ILayoutInitialState> {
    @observable.ref public layout: ISitecoreLayout;
    public dictionary: ISitecoreDictionary;
    public rawCookies: string = '';

    @observable whenDropdownExperimentTestVariant: string | undefined;
    @observable currentPath: string;
    @observable prevPath: string;
    @observable prevTemplateId: SitecoreTemplateId | TradePortalSitecoreTemplateId | undefined;
    @observable prevLayoutName: string;
    @observable prevBaseTemplates: SitecoreTemplateId[] | TradePortalSitecoreTemplateId[] | undefined;
    @observable prevDestinationCode: string;
    @observable prevGiataHotelCode: string;
    @observable isLayoutError = false;
    @observable lang: TSitecoreLangs;
    @observable dateLocale: string;
    public referrer: Nullable<string>;
    public domain: Nullable<string>;
    public protocol: string;
    @observable public fullUrl: string;
    @observable public basePath: string;
    public tooltipSettings: Nullable<IPriceTooltipSetting[]>;
    private settings: Map<string, any> = new Map<string, any>();
    public isNotificationsTimerStarted = false;
    @observable isBodyScrollLocked: boolean = false;
    @observable isOffersPriceViewTotal: boolean = false;
    @observable isCheapestComparePriceOption: boolean = false;
    public isMobileDeviceDetectedDuringSSR: boolean = false; // phones & tablets
    @observable private readonly trackedOptimizelyComponentFeatureKeys: Set<string> = new Set<string>();
    @observable private optimizelyClientInstance: ReactSDKClient | null = null;

    constructor(
        public rootStore: TRootStore,
        public siteTemplatesIds: typeof SitecoreTemplateId | typeof TradePortalSitecoreTemplateId = SitecoreTemplateId,
    ) {
        makeObservable(this);

        if (!isBackend() && location.pathname.endsWith(SitePath.BookingConfirmation) && isNavigatorGoBack()) {
            location.replace('/');
        }

        /*
            Check if personalization cookie is set.
            If not, then listen to save cookies button click inside cookies banner.
         */
        if (!isBackend()) {
            const cookieValue = getCookie(settings.Cookies.Personalization);

            // personalization cookie is already set => nothing to do
            if (cookieValue) {
                return;
            }

            // listen to accept cookies click
            document.addEventListener('click', this.listenToAcceptCookiesClick);
        }
    }

    get isCameFromMicroAppManage(): boolean {
        if (globalThis.window === undefined) return false;

        // First entry to the holiday app from microApp manage
        return !this.rootStore.routerStore.prevUrl && globalThis.window.document.referrer.includes('/manage');
    }

    public deserialize(initialState: ILayoutInitialState = {}): void {
        if (initialState.cookies) {
            this.rawCookies = initialState.cookies;
        }

        this.isMobileDeviceDetectedDuringSSR = !!initialState.isMobileDeviceDetectedDuringSSR;

        if (initialState.lang) {
            this.updateLang(initialState.lang);
        }

        if (initialState.dateLocale) {
            this.changeDateLocale(initialState.dateLocale);
        }

        if (initialState.layout) {
            this.layout = initialState.layout;
            this.prevTemplateId = this.templateId;
            this.prevLayoutName = this.layoutName;

            if (!isBackend() && this.isEditMode) {
                fixExpEditorClickEvents();
            }

            setTimeout(() => this.trackPatternCard());
        }

        if (initialState.dictionary) {
            this.dictionary = initialState.dictionary;
        }

        if (initialState.settings) {
            this.settings = new Map(initialState.settings);
            this.initializeOffersPriceView();
        }

        if (initialState.tooltipSettings?.length) {
            this.tooltipSettings = initialState.tooltipSettings;
        }

        if (initialState.currentPath) {
            this.currentPath = initialState.currentPath;
        }

        if (initialState.domain) {
            this.domain = initialState.domain;
        }

        if (initialState.protocol) {
            this.protocol = initialState.protocol;
        }

        if (initialState.fullUrl) {
            this.fullUrl = initialState.fullUrl;
        }

        if (initialState.referrer) {
            this.referrer = initialState.referrer;
        }

        this.initializeBasePath(initialState);

        if (!isBackend()) {
            // replace url when we had layout redirect
            if (initialState.layout?.meta?.shouldRedirect) {
                // setTimeout hack to ensure that routerStore is actually working
                setTimeout(
                    () =>
                        initialState.layout?.meta?.url &&
                        this.rootStore.routerStore.updateUrl(initialState.layout?.meta?.url),
                );
            }

            if (this.shouldInitSubscribeFlow) {
                // setTimeout hack to ensure that routerStore is actually working
                setTimeout(() => this.rootStore.notificationsStore.initSubscribeFlow());
            }
        }
    }

    public serialize(): ILayoutInitialState {
        return {
            // Don't serialize layout, as nextjs also do it (see pageProps from SSR)
            // layout: toJS(this.layout),
            cookies: this.rawCookies,
            dictionary: this.dictionary,
            settings: Array.from(this.settings),
            tooltipSettings: toJS(this.tooltipSettings),
            currentPath: toJS(this.currentPath),
            lang: this.lang,
            domain: this.domain,
            protocol: this.protocol,
            fullUrl: this.fullUrl,
            basePath: this.basePath,
            dateLocale: this.dateLocale,
            referrer: this.referrer,
            isMobileDeviceDetectedDuringSSR: this.isMobileDeviceDetectedDuringSSR,
        };
    }

    @computed get isTradePortal(): boolean {
        return this.context?.site?.name === SiteName.TradePortal;
    }

    @computed get context(): ISitecoreLayoutContext | undefined {
        return this.layout?.sitecore?.context;
    }

    @computed get route(): ISitecoreLayoutRoute | undefined {
        return this.layout?.sitecore?.route;
    }

    @computed get layoutId(): string {
        return this.route?.itemId ?? '';
    }

    @computed get layoutName(): string {
        return this.route?.name ?? '';
    }

    @computed get displayName(): string {
        return this.route?.displayName ?? '';
    }

    @computed get templateId(): SitecoreTemplateId | TradePortalSitecoreTemplateId | undefined {
        return this.route?.templateId;
    }

    @computed get pageFields(): { [name: string]: ISitecoreField<any> } | null {
        return this.route?.fields || null;
    }

    @computed get pageTitle(): string {
        return this.pageFields?.PageTitle?.value ?? '';
    }

    @computed get pageName(): string {
        return this.pageFields?.Name?.value ?? '';
    }

    /** Page urls in other languages */
    @computed get pageUrls(): Record<TCmsLang, string> | undefined {
        return this.context?.pageUrls;
    }

    @computed get shouldTrackUrl(): boolean {
        return this.pageFields?.ShouldTrackUrl?.value || false;
    }

    @computed get trackingGoalId(): string {
        return this.route?.fields?.TrackingGoal?.id || '';
    }

    @computed get pageBreadcrumbs(): IBreadcrumb[] {
        return this.context?.parentPages || [];
    }

    @computed get pageProfile(): INestedObject | undefined {
        return this.context?.pageProfile || undefined;
    }

    @computed get destinationCode(): string {
        return this.isDestinationPage ? this.pageFields?.Code?.value : '';
    }

    @computed get giataHotelCode(): string {
        return this.pageFields?.GiataCode?.value ?? '';
    }

    /** Hotel All Codes */
    @computed get allAccommodationCodes(): string[] {
        return (this.context?.accommodationCodes || []).filter(Boolean);
    }

    /** Single hotel accommodation code. First from all available room codes. Or destination code. */
    @computed get accommodationOrDestinationCode(): string {
        return this.allAccommodationCodes[0] || this.destinationCode;
    }

    @computed get holidayThemeTypes(): string[] {
        return (this.route?.fields?.HolidayThemeTypes || [])
            .map(item => item.fields?.Bd4ThemeTypeCode?.value)
            .filter(item => !!item);
    }

    @computed get promoCollections(): string[] {
        return (this.route?.fields?.PromoCollections || [])
            .map(item => item.fields?.PromotionCodes?.value)
            .filter(item => !!item);
    }

    @computed get isEditMode(): boolean {
        return this.context?.pageEditing ?? false;
    }

    @computed get isPreviewMode(): boolean {
        return this.context?.pageState === LayoutServicePageState.Preview;
    }

    @computed get isExperienceEditor(): boolean {
        return this.isEditMode || this.isPreviewMode;
    }

    @computed get isFullMaintenance(): boolean {
        return this.context?.isFullMode ?? false;
    }

    @computed get isSoftMaintenance(): boolean {
        return this.context?.isSoftMode ?? false;
    }

    @computed get isMaintenance(): boolean {
        return this.isSoftMaintenance || this.isFullMaintenance;
    }

    @computed get isGreyOverlayShown(): boolean {
        return this.isMaintenance && (this.isPromoPage || this.isShortlistPage || this.isShortlistNoResultsPage);
    }

    // HotelBrowsePage also have this template in the list
    @computed get isDestinationPage(): boolean {
        return (this.context?.baseTemplates || []).some(id => id === this.siteTemplatesIds.DestinationPage);
    }

    @computed get isDestinationPagePrev(): boolean {
        return (this.prevBaseTemplates || []).some(id => id === this.siteTemplatesIds.DestinationPage);
    }

    @computed get isAllDestinationsPage(): boolean {
        return this.templateId === this.siteTemplatesIds.AllDestinationsPage;
    }

    @computed get isCountryBrowsePage(): boolean {
        return this.templateId === this.siteTemplatesIds.CountryBrowsePage;
    }

    @computed get isRegionBrowsePage(): boolean {
        return this.templateId === this.siteTemplatesIds.RegionBrowsePage;
    }

    @computed get isRegionCityBrowsePage(): boolean {
        return this.templateId === this.siteTemplatesIds.RegionCityBrowsePage;
    }

    @computed get isVirtualRegionBrowsePage(): boolean {
        return this.templateId === this.siteTemplatesIds.VirtualRegionBrowsePage;
    }

    @computed get isVirtualResortBrowsePage(): boolean {
        return this.templateId === this.siteTemplatesIds.VirtualResortBrowsePage;
    }

    @computed get isResortBrowsePage(): boolean {
        return this.templateId === this.siteTemplatesIds.ResortBrowsePage;
    }

    @computed get isHotelDetailsBrowsePage(): boolean {
        return this.templateId === this.siteTemplatesIds.HotelDetailsBrowse;
    }

    @computed get isHotelDetailsBrowsePagePreview(): boolean {
        const hotelPreviewParam =
            this.rootStore.queryParamsStore?.query[QueryParamName.HotelPreview] ||
            this.rootStore.routerStore.router?.query[QueryParamName.HotelPreview];

        return this.isHotelDetailsBrowsePage && !!hotelPreviewParam;
    }

    @computed get isAmendPassengerDetailsPage(): boolean {
        return this.templateId === (this.siteTemplatesIds as typeof SitecoreTemplateId).AmendPassengerDetailsPage;
    }

    @computed get isHotelDetailsBookPage(): boolean {
        return this.templateId === this.siteTemplatesIds.HotelDetailsBook;
    }

    @computed get isHotelDetailsBookPagePrev(): boolean {
        return this.prevTemplateId === this.siteTemplatesIds.HotelDetailsBook;
    }

    @computed get isExtrasPage(): boolean {
        return this.templateId === this.siteTemplatesIds.ExtrasPage;
    }

    @computed get isDealsHubPage(): boolean {
        return this.templateId === this.siteTemplatesIds.DealsPage;
    }

    @computed get isGuestDetailsPage(): boolean {
        return this.templateId === this.siteTemplatesIds.GuestDetailsPage;
    }

    @computed get isViewBookingPage(): boolean {
        return (
            this.templateId === this.siteTemplatesIds.MyBookingPage ||
            this.templateId === this.siteTemplatesIds.PreTravelPage ||
            this.templateId === this.siteTemplatesIds.InDestinationPage ||
            this.templateId === this.siteTemplatesIds.PostTravelPage
        );
    }

    @computed get isBookingsListPage(): boolean {
        return this.templateId === this.siteTemplatesIds.MyBookingsPage;
    }

    @computed get isConfirmationPage(): boolean {
        return this.templateId === this.siteTemplatesIds.BookingConfirmationPage;
    }

    @computed get isPostBookingPages(): boolean {
        return this.isViewBookingPage || this.isConfirmationPage;
    }

    @computed get isHomePage(): boolean {
        return this.templateId === this.siteTemplatesIds.HomePage;
    }

    @computed get mobileAppCookieQuery(): Record<string, string> {
        const cookieValue = getCookieFromContext(CookiesKeys.EjMobileAppContext, this.rawCookies);

        return parseQuery(cookieValue);
    }

    @computed get isMobileApp(): boolean {
        return Object.keys(this.mobileAppCookieQuery).length > 0;
    }

    @computed get isMobileAppHideFeatures(): boolean {
        return this.isMobileApp && this.mobileAppCookieQuery[MobileAppCookieKeys.HideFeatures] === 'true';
    }

    @computed get isMobileAppDarkMode(): boolean {
        return this.isMobileApp && this.mobileAppCookieQuery[MobileAppCookieKeys.DarkMode] === 'true';
    }

    @computed get isPromoPage(): boolean {
        return (
            this.templateId === this.siteTemplatesIds.PromoPage ||
            this.isDynamicPromoPage ||
            this.isRecurringPromoPage ||
            this.isPeriodDrivenPromoPage
        );
    }

    @computed get isPromoPagePrev(): boolean {
        return (
            this.prevTemplateId === this.siteTemplatesIds.PromoPage ||
            this.isDynamicPromoPage ||
            this.isRecurringPromoPage ||
            this.isPeriodDrivenPromoPage
        );
    }

    @computed get isStaticPromoPage(): boolean {
        return this.isPromoPage && !this.isDynamicPromoPage;
    }

    @computed get isNotFoundPage(): boolean {
        return this.templateId === this.siteTemplatesIds.NotFoundPage;
    }

    @computed get isOldDynamicPromoPage(): boolean {
        return this.templateId === this.siteTemplatesIds.DynamicPromoPage;
    }

    @computed get isDynamicPromoPageLayout(): boolean {
        return this.templateId === this.siteTemplatesIds.DynamicPromoPageLayout;
    }

    @computed get isDynamicPromoPage(): boolean {
        return this.isOldDynamicPromoPage || this.isDynamicPromoPageLayout;
    }

    @computed get isDynamicPromoPagePrev(): boolean {
        return this.prevTemplateId === this.siteTemplatesIds.DynamicPromoPageLayout;
    }

    @computed get isRecurringPromoPage(): boolean {
        return this.templateId === this.siteTemplatesIds.RecurringPromoPage;
    }

    @computed get isPeriodDrivenPromoPage(): boolean {
        return this.templateId === this.siteTemplatesIds.PeriodDrivenPromoPage;
    }

    @computed get isSearchResultsPage(): boolean {
        return this.templateId === this.siteTemplatesIds.SearchResultsPage;
    }

    @computed get isSearchResultsPagePrev(): boolean {
        return this.prevTemplateId === this.siteTemplatesIds.SearchResultsPage;
    }

    @computed get isGenericPage(): boolean {
        return this.templateId === this.siteTemplatesIds.GenericPage;
    }

    @computed get isShortlistPage(): boolean {
        return this.templateId === this.siteTemplatesIds.ShortlistPage;
    }

    @computed get isShortlistPagePrev(): boolean {
        return this.prevTemplateId === this.siteTemplatesIds.ShortlistPage;
    }

    @computed get isPricePromisePage(): boolean {
        return this.templateId === this.siteTemplatesIds.PricePromisePage;
    }

    @computed get isShortlistNoResultsPage(): boolean {
        return this.templateId === this.siteTemplatesIds.ShortlistNoResultsPage;
    }

    @computed get isAllHolidayTypesPage(): boolean {
        return this.templateId === this.siteTemplatesIds.AllHolidayTypesPage;
    }

    @computed get isHolidayTypePage(): boolean {
        return this.templateId === this.siteTemplatesIds.HolidayTypePage;
    }

    @computed get isHolidayInspirationPage(): boolean {
        return this.templateId === (this.siteTemplatesIds as typeof SitecoreTemplateId).HolidayInspirationPage;
    }

    @computed get destinationParents(): IDestination[] {
        return this.context?.parents || [];
    }

    @computed get defaultSearchResultsNumber(): number {
        return this.getSettingAsNumber(SiteSettings.SearchResultsItemsPerPage) || settings.Default.itemsPerPage;
    }

    @computed get promoPageSearchResultsNumber(): number {
        return this.getSettingAsNumber(SiteSettings.PromoPageItemsPerPage) || settings.Default.itemsPerPage;
    }

    @computed get numberOfResultsPerPage(): number {
        if (this.isPromoPage) {
            return this.promoPageSearchResultsNumber;
        }

        return this.defaultSearchResultsNumber;
    }

    @computed get isExcursionsEnabled(): boolean {
        return !!this.getSetting(SiteSettings.IsExcursionsEnabled);
    }

    @computed get excursionDescriptionMaxLines(): number {
        return this.getSetting(SiteSettings.ExcursionDescriptionMaxLines);
    }

    @computed get isDestinationUnavailableBannerEnabled(): boolean {
        return !!this.getSetting(SiteSettings.IsDestinationUnavailableBannerEnabled);
    }

    @computed get isErrataEnabled(): boolean {
        return !!this.getSetting(SiteSettings.IsErrataEnabled);
    }

    @computed get isFacilityErrataEnabled(): boolean {
        return !!this.getSetting(SiteSettings.IsFacilityErrataEnabled);
    }

    @computed get isLivePriceEnabled(): boolean {
        return !!this.getSetting(SiteSettings.IsLivePriceEnabled) && !this.isMaintenance;
    }

    @computed get isNumberOfNightsLabelsEnabled(): boolean {
        return !!this.getSetting(SiteSettings.EnableNumberOfNightsLabel);
    }

    @computed get isFeaturedHotelsLivePriceEnabled(): boolean {
        return this.isLivePriceEnabled && !!this.getSetting(SiteSettings.FeaturedHotelsLivePrice);
    }

    @computed get isHolidayTypeRecommenderCarouselEnabled(): boolean {
        return !!this.getSetting(SiteSettings.IsHolidayTypeRecommenderCarouselEnabled);
    }

    @computed get isSmartSeerCarouselCTANoFollowLinkEnabled(): boolean {
        return !!this.getSetting(SiteSettings.EnableNoFollowLinksOnCTA);
    }

    @computed get isMosaicComponentLivePriceEnabled(): boolean {
        return this.isLivePriceEnabled && !!this.getSetting(SiteSettings.MosaicComponentLivePrice);
    }

    @computed get isDestinationHeroBannerLivePriceEnabled(): boolean {
        return this.isLivePriceEnabled && !!this.getSetting(SiteSettings.DestinationHeroBannerLivePrice);
    }

    @computed get isMasonryCarouselLivePriceEnabled(): boolean {
        return this.isLivePriceEnabled && !!this.getSetting(SiteSettings.MasonryCarouselLivePrice);
    }

    @computed get isDestinationLikeLivePriceEnabled(): boolean {
        return this.isLivePriceEnabled && !!this.getSetting(SiteSettings.DestinationLikeLivePrice);
    }

    @computed get isHotelDetailsBrowseStateLivePriceEnabled(): boolean {
        return this.isLivePriceEnabled && !!this.getSetting(SiteSettings.HotelDetailsBrowseStateLivePrice);
    }

    @computed get isAllRegionsLivePriceEnabled(): boolean {
        return this.isLivePriceEnabled && !!this.getSetting(SiteSettings.ShowAllRegionsLivePrice);
    }

    @computed get isViewHolidaysResultsLivePriceEnabled(): boolean {
        return this.isLivePriceEnabled && !!this.getSetting(SiteSettings.ShowViewHolidaysResultsLivePrice);
    }

    @computed get isShortlistsLivePriceEnabled(): boolean {
        return this.isLivePriceEnabled && !!this.getSetting(SiteSettings.ShortlistsLivePrice);
    }

    @computed get isSearchFlexibleOnDestinationGuide(): boolean {
        return !!this.getSetting(SiteSettings.IsSearchFlexibleOnDestinationGuide);
    }

    @computed get destinationWithoutLivePrice(): string[] {
        return this.getSetting(SiteSettings.ExcludeLivePriceForDestinations) || [];
    }

    @computed get isGeolocationEnabled(): boolean {
        return !!this.getSetting(SiteSettings.IsGeolocationEnabled);
    }

    @computed get isCloudinaryDisabled(): boolean {
        return !!this.getSetting(SiteSettings.DisableCloudinaryPlayer);
    }

    @computed get geolocationBounds(): number[][] | null {
        let bounds = this.getSetting(SiteSettings.GeolocationBounds);

        if (!bounds) {
            return null;
        }

        // from '1,2;3,4' to [[1, 2], [3, 4]]
        bounds = bounds.split(';');

        bounds = bounds.map((bound: string) => {
            const points = bound.split(',');

            return [Number(points[0]), Number(points[1])];
        });

        return bounds;
    }

    @computed get filtersOrder(): FilterGroupCodes[] {
        const filtersOrder: IFilterOrderSetting[] = this.route?.fields?.['Filters Order'];

        if (!filtersOrder?.length) {
            return DEFAULT_FILTER_ORDER;
        }

        return filtersOrder.map(o => o.fields?.Code?.value);
    }

    @computed get isPromoCodeEnabled(): boolean {
        return !!this.getSetting(SiteSettings.IsPromoCodeEnabled);
    }

    @computed get isPaxMixPopupEnabled(): boolean {
        return !!this.getSetting(SiteSettings.IsPaxMixPopupEnabled);
    }

    @computed get isSpecialRequestEnabled(): boolean {
        return !!this.getSetting(SiteSettings.IsSSREnabled);
    }

    @computed get isEligibleToAddSSRForDC(): boolean {
        return this.isSpecialRequestEnabled && !!this.getSetting(SiteSettings.IsEligibleToAddSSRForDC);
    }

    @computed get isEligibleToAddSSRForHBG(): boolean {
        return this.isSpecialRequestEnabled && !!this.getSetting(SiteSettings.IsEligibleToAddSSRForHBG);
    }

    @computed get isTooltipIconDisabled(): boolean {
        return !!this.getSetting(SiteSettings.DisableHolidayTypeTooltipIcon);
    }

    @computed get isSpecialAssistanceEnabled(): boolean {
        return !!this.getSetting(SiteSettings.IsSpecialAssistanceEnabled);
    }

    @computed get isAssistedTravelOnlineFormEnabled(): boolean {
        return this.getSettingAsBoolean(SiteSettings.EnableAssistedTravelOnlineForm);
    }

    @computed get daysBeforeDepartureTravelAssistanceCanBeRequested(): number {
        return this.getSettingAsNumber(SiteSettings.DaysBeforeDepartureTravelAssistanceCanBeRequested);
    }

    @computed get shouldInitSubscribeFlow(): boolean {
        return (
            (this.isSearchResultsPage || this.isHotelDetailsBookPage || this.isHomePage) &&
            !!this.trackingGoalId &&
            !this.isNotificationsTimerStarted
        );
    }

    @computed get isDestinationMapEnableOnDesktop(): boolean {
        return !!this.getSetting(SiteSettings.IsDestinationMapHiddenOnDesktop);
    }

    @computed get isFreeNightsEnabled(): boolean {
        return !!this.getSetting(SiteSettings.IsFreeNightsEnabled);
    }

    @computed get isGreatDealPillEnabled(): boolean {
        return !!this.getSetting(SiteSettings.IsGreatDealPillEnabled);
    }

    @computed get isFullScreenCarouselEnabledHotelDetailsDesktop(): boolean {
        return !!this.getSetting(SiteSettings.IsFullScreenCarouselEnabledHotelDetailsDesktop);
    }

    @computed get isFullScreenCarouselEnabledHotelDetailsMobile(): boolean {
        return !!this.getSetting(SiteSettings.IsFullScreenCarouselEnabledHotelDetailsMobile);
    }

    @computed get isFullScreenCarouselEnabledPromoMobile(): boolean {
        return !!this.getSetting(SiteSettings.IsFullScreenCarouselEnabledPromoMobile);
    }

    @computed get isFullScreenCarouselEnabledPromoDesktop(): boolean {
        return !!this.getSetting(SiteSettings.IsFullScreenCarouselEnabledPromoDesktop);
    }

    @computed get isFullScreenEnabledHotelDetails(): boolean {
        return this.rootStore.appStore.isScreenLarge
            ? this.isFullScreenCarouselEnabledHotelDetailsDesktop
            : this.isFullScreenCarouselEnabledHotelDetailsMobile;
    }

    @computed get isFullScreenEnabledPromo(): boolean {
        return this.rootStore.appStore.isScreenLarge
            ? this.isFullScreenCarouselEnabledPromoDesktop
            : this.isFullScreenCarouselEnabledPromoMobile;
    }

    @computed get isFullScreenCarouselEnabledSearchResultsDesktop(): boolean {
        return !!this.getSetting(SiteSettings.IsFullScreenCarouselEnabledSearchResultsDesktop);
    }

    @computed get isFullScreenCarouselEnabledSearchResultsMobile(): boolean {
        return !!this.getSetting(SiteSettings.IsFullScreenCarouselEnabledSearchResultsMobile);
    }

    @computed get isFullScreenEnabledSearchResults(): boolean {
        return this.rootStore.appStore.isScreenLarge
            ? this.isFullScreenCarouselEnabledSearchResultsDesktop
            : this.isFullScreenCarouselEnabledSearchResultsMobile;
    }

    @computed get isTransferDurationEnabled(): boolean {
        return (
            (this.isExtrasPage && !!this.getSetting(SiteSettings.TransferDurationEnabled)) ||
            ((this.isConfirmationPage || this.isViewBookingPage) &&
                !!this.getSetting(SiteSettings.TransferDurationEnabledOnViewBookingAndConfirmationPage))
        );
    }

    @computed get isTransferInstructionsEnabled(): boolean {
        return !!this.getSetting(SiteSettings.IsTransferInstructionsEnabled);
    }

    @computed get isPrivateTransferPromoEnabled(): boolean {
        return this.isTransferDurationEnabled && !!this.getSetting(SiteSettings.PrivateTransferPromoEnabled);
    }

    // hold luggage settings section
    @computed get isHoldLuggageEnabled(): boolean {
        return this.getSettingAsBoolean(SiteSettings.IsHoldLuggageEnabled);
    }

    @computed get isSportsEquipmentEnabled(): boolean {
        return this.getSettingAsBoolean(SiteSettings.IsSportsEquipmentEnabled);
    }

    @computed get isCabinBagsEnabled(): boolean {
        return this.getSettingAsBoolean(SiteSettings.IsCabinBagsEnabled);
    }

    @computed get isExtraLuggageEnabled(): boolean {
        return this.isHoldLuggageEnabled || this.isSportsEquipmentEnabled;
    }

    @computed get includedLuggageCode(): string {
        const setting = this.getSetting(SiteSettings.FreeBagsPerPassenger) || '';

        // this setting has a view like `LUG=1&LUS=2`
        const firstIncludedBag = setting.split('&')[0];

        // this setting has a view like `LUG=1`
        return firstIncludedBag.split('=')[0];
    }

    @computed get maxNumberOfAdditionalLuggage(): number {
        const count = this.getSetting(SiteSettings.MaxAdditionalLuggagePerPassenger);

        return count && !Number.isNaN(count) ? Number(count) : 0;
    }

    @computed get holdLuggageCategoryCodes(): string[] {
        const setting = this.getSetting(SiteSettings.HoldLuggageCategoryCodes);

        return setting?.split(',') || [];
    }

    @computed get extraLuggageCategoryCodes(): string[] {
        const holdLuggageCategoryCodes = this.holdLuggageCategoryCodes;
        const sportEquipmentCategoryCodes = this.sportEquipmentCategoryCodes;

        return [...holdLuggageCategoryCodes, ...sportEquipmentCategoryCodes];
    }

    @computed get largeCabinBagsCategoryCode(): string[] {
        const setting = this.getSetting(SiteSettings.LargeCabinBagCategoryCode);

        return setting?.split(',') || [];
    }

    @computed get maxNumberOfSportEquipments(): number {
        const count = this.getSetting(SiteSettings.MaxSportItemsPerPassenger);

        return count && !Number.isNaN(count) ? Number(count) : 0;
    }

    @computed get sportEquipmentCategoryCodes(): string[] {
        const setting = this.getSetting(SiteSettings.SportsEquipmentCategoryCodes);

        return setting?.split(',') || [];
    }

    @computed get maxNumberOfLargeSportsEquipment(): number {
        const count = this.getSetting(SiteSettings.MaxLargeSportItemsPerBooking);

        return count && !Number.isNaN(count) ? Number(count) : 0;
    }

    @computed get largeCabinBagCode(): string {
        return this.getSetting(SiteSettings.LargeCabinBagCode);
    }

    @computed get maxNumberOfCabinBagsPP(): number {
        const count = this.getSetting(SiteSettings.LargeCabinBagMaxPerPassenger);

        return count && !Number.isNaN(count) ? Number(count) : 0;
    }

    @computed get largeSportEquipmentCategoryCode(): string {
        return this.getSetting(SiteSettings.LargeSportsEquipmentCategoryCode);
    }

    @computed get SEAccommodationNoticePeriod(): number {
        return this.getSettingAsNumber(SiteSettings.SportEquipmentAccommodationNoticePeriod);
    }

    @computed get shouldPromoteBags(): boolean {
        const promoOption = this.getSetting(SiteSettings.BagsPromotionUpSell);

        if (promoOption) {
            const { defaultBagsNumber } = this.rootStore.bookingStore.extraLuggage;

            return (
                promoOption === BagsPromotionCode.All || (promoOption === BagsPromotionCode.Zero && !defaultBagsNumber)
            );
        }

        return false;
    }

    @computed get privateTransferPromoMinDiffTime(): number {
        const time = this.getSetting(SiteSettings.PrivateTransferPromoMinDiffTime);

        return time && !Number.isNaN(time) ? Number(time) : 0;
    }

    @computed get isWeLovePillEnabled(): boolean {
        return !!this.getSetting(SiteSettings.IsWeLovePillEnabled);
    }

    @computed get isLateCheckoutEnabledBySitecore(): boolean {
        return !!this.getSetting(SiteSettings.IsLateCheckoutEnabled);
    }

    @computed get timeForLateRoomCheckout(): Nullable<Date> {
        return this.getSettingAsDate(SiteSettings.TimeForLateRoomCheckout);
    }

    @computed get isTerminalInformationEnabled(): boolean {
        return !!this.getSetting(SiteSettings.IsTerminalInformationEnabled);
    }

    @computed get isPriceViewToggleEnabled(): boolean {
        return !!this.getSetting(SiteSettings.IsPriceViewToggleEnabled);
    }

    @computed get isAlternativeBoardsEnabled(): boolean {
        if (this.isPromoPage) {
            if (!this.getSettingAsBoolean(SiteSettings.EnableAlternativeBoardsPromoPages)) {
                return false;
            }

            const excludedPagesIds: string[] = this.getSetting(SiteSettings.AlternativeBoardsExcludedPromoPages) ?? [];

            return !excludedPagesIds.includes(this.layoutName);
        }

        return this.getSettingAsBoolean(SiteSettings.EnableAlternativeBoardsSearchResults);
    }

    @action initializeOffersPriceView = (): void => {
        this.isOffersPriceViewTotal = !!this.getSetting(SiteSettings.IsPriceViewToggleTotalDefault);
    };

    @action onChangeOffersPriceView = (): void => {
        this.isOffersPriceViewTotal = !this.isOffersPriceViewTotal;
        this.rootStore.trackingStore.trackOffersPriceViewChange();
    };

    @action setIsCheapestComparePriceOption = (value: boolean): void => {
        this.isCheapestComparePriceOption = value;
    };

    @action setIsNotificationsTimerStarted = (isStarted: boolean): void => {
        this.isNotificationsTimerStarted = isStarted;
    };

    // Facilities Design Variants
    @computed get isHotelFacilitiesTabsDesignEnabled(): boolean {
        return !!this.getSetting(SiteSettings.IsHotelFacilitiesTabsDesignEnabled);
    }

    @computed get isEcoCertifiedEnabledOnSearchPage(): boolean {
        return !!this.getSetting(SiteSettings.IsEcoCertifiedEnabledOnSearchPage);
    }

    @computed get isEcoCertifiedEnabledOnHotelDetailsPage(): boolean {
        return !!this.getSetting(SiteSettings.IsEcoCertifiedEnabledOnHotelDetailsPage);
    }

    @computed get isEcoCertifiedEnabledInFacilitiesTabs(): boolean {
        return !!this.getSetting(SiteSettings.IsEcoCertifiedEnabledInFacilitiesTabs);
    }

    @computed get isEcoCertifiedEnabledOnBookingListPage(): boolean {
        return !!this.getSetting(SiteSettings.IsEcoCertifiedEnabledOnBookingListPage);
    }

    @computed get isEcoCertifiedEnabledOnHotelSummaryInViewBookingPage(): boolean {
        return !!this.getSetting(SiteSettings.IsEcoCertifiedEnabledOnHotelSummaryInViewBookingPage);
    }

    @computed get ShowFacilityFilterGroupList(): string[] {
        return this.getSetting(SiteSettings.ShowFacilityFilterGroupList) || [];
    }

    @computed get isAmendBookingPage(): boolean {
        return this.isAmendFlightsPage || this.isAmendTransfersPage || this.isAmendPassengerDetailsPage;
    }

    @computed get isAmendTransfersPage(): boolean {
        return this.templateId === SitecoreTemplateId.AmendTransfersPage;
    }

    @computed get isAmendDatesSummaryPage(): boolean {
        return this.templateId === SitecoreTemplateId.AmendDatesSummaryPage;
    }

    @computed get isAmendHotelSummaryPage(): boolean {
        return this.layout?.sitecore?.route?.templateId === SitecoreTemplateId.AmendHotelSummaryPage;
    }

    @computed get isAmendHotelPage(): boolean {
        return this.layout?.sitecore?.route?.templateId === SitecoreTemplateId.AmendHotelPage;
    }

    @computed get isAmendDatesPage(): boolean {
        return this.templateId === SitecoreTemplateId.AmendDatesPage;
    }

    @computed get isAmendFlightsPage(): boolean {
        return this.templateId === SitecoreTemplateId.AmendFlightsPage;
    }

    @computed get isAmendRoomAndBoardPage(): boolean {
        return this.templateId === SitecoreTemplateId.ChangeRoomAndBoardTemplate;
    }

    @computed get isAmendPaymentPage(): boolean {
        return (
            this.templateId === SitecoreTemplateId.AmendPaymentPage ||
            this.templateId === SitecoreTemplateId.TradePortalAmendPaymentPage
        );
    }

    @computed get isCreditBookingEnabled(): boolean {
        return !!this.getSetting(SiteSettings.EnableCreditBooking);
    }

    @computed get isATOLProtectionEnabled(): boolean {
        return this.getSettingAsBoolean(SiteSettings.IsATOLProtectionEnabled);
    }

    @computed get isViewBookingRedirectsEnabled(): boolean {
        return this.getSettingAsBoolean(SiteSettings.IsViewBookingRedirectsEnabled);
    }

    @computed get viewBookingLinks(): TViewBookingRedirectsPaths {
        return {
            inDestination: this.getSettingAsUrlString(SiteSettings.BookingInDestinationLink),
            preTravel: this.getSettingAsUrlString(SiteSettings.BookingPreTravelLink),
            postTravel: this.getSettingAsUrlString(SiteSettings.BookingPostTravelLink),
            viewBooking: this.getSettingAsUrlString(SiteSettings.BookingViewLink),
            cancelled: this.getSettingAsUrlString(SiteSettings.CancelledBookingLink),
        };
    }

    @computed get bookingHoursPreTravelStarts(): number {
        return this.getSettingAsNumber(SiteSettings.BookingHoursPreTravelStarts);
    }

    @computed get bookingHoursPostTravelStarts(): number {
        return this.getSettingAsNumber(SiteSettings.BookingHoursPostTravelStarts);
    }

    @computed get areStrikethroughPricesEnabled(): boolean {
        return (
            !!this.getSetting(SiteSettings.AreStrikethroughPricesEnabled) &&
            (this.isPromoPage || this.isSearchResultsPage)
        );
    }

    @computed get isHotelCheckInEnabled(): boolean {
        return this.getSettingAsBoolean(SiteSettings.IsHotelCheckInEnabled);
    }

    @computed get isCompareDealsEnabledOnSearchResultsPage(): boolean {
        return this.getSettingAsBoolean(SiteSettings.IsCompareDealsEnabledOnSearchResultsPage);
    }

    @computed get isDiscountPercentagePillEnabled(): boolean {
        return this.getSettingAsBoolean(SiteSettings.IsDiscountPercentagePillEnabled);
    }

    isPageHasTemplateId = (templateId: SitecoreTemplateId): boolean => this.templateId === templateId;

    getVariantFacilitiesCodes = (variant: FacilitiesDesignVariant): string[] => {
        switch (variant) {
            case FacilitiesDesignVariant.List:
                return this.getSetting(SiteSettings.HotelFacilitiesVariantListDesign) || [];

            case FacilitiesDesignVariant.Tabs:
                return this.getSetting(SiteSettings.HotelFacilitiesVariantTabsDesign) || [];
        }
    };

    filterFacilitiesByDesignVariant = (
        facilityGroups: IFacilityGroup[],
        variant: FacilitiesDesignVariant,
        isEcoFacility: boolean = false,
    ): IFacilityGroup[] => {
        const variantFacilitiesCodes = this.getVariantFacilitiesCodes(variant);
        const facilityGroupsFiltered = facilityGroups.filter(group => variantFacilitiesCodes.includes(group.code));

        // EJH-18530 order of tabs should be the same as in Sitecore /sitecore/content/EasyJet/Holidays/Settings/Facilities Settings
        const facilityGroupsSorted = facilityGroupsFiltered.sort((f1, f2) =>
            sortBy(f1, f2, el => variantFacilitiesCodes.indexOf(el.code)),
        );

        return filterOutOverviewGroup(
            facilityGroupsSorted,
            this.isEcoCertifiedEnabledInFacilitiesTabs && isEcoFacility,
        );
    };

    @action trackPatternCard = (): void => {
        if (!this.isHotelDetailsBookPage || !this.rootStore.queryParamsStore.query[QueryParamName.Theme]) {
            return;
        }

        notificationsService.trackDataForNotification(notificationsUrls.triggerPatternCard(), {
            hotelType: this.rootStore.queryParamsStore.query[QueryParamName.Theme],
        });
    };

    @action updateLayout(layout: ISitecoreLayout): void {
        this.prevPath = this.currentPath;
        this.currentPath = location.pathname.startsWith(this.basePath)
            ? location.pathname.replace(this.basePath, '')
            : location.pathname;

        if (!this.currentPath) {
            this.currentPath = '/';
        }

        // update url with appropriate value when there is a redirect
        if (layout?.meta?.shouldRedirect && !isBackend()) {
            this.rootStore.routerStore.updateUrl(layout?.meta?.url);
        }

        // save previous template ID
        this.prevTemplateId = this.templateId;
        this.prevLayoutName = this.layoutName;
        this.prevBaseTemplates = this.context?.baseTemplates;
        this.prevDestinationCode = this.destinationCode;
        this.prevGiataHotelCode = this.giataHotelCode;
        this.layout = layout;

        // sync language from layout context to keep lang in sync during client-side navigation
        const contextLanguage = layout?.sitecore?.context?.language;

        if (contextLanguage) {
            const urlLang = getLangByCMSLang(contextLanguage) as TSitecoreLangs;

            if (urlLang) {
                this.updateLang(urlLang);
            }
        }

        // if it's a page with search results then get Sort Order from it and store in search store
        this.setPageSearchSortOrder();

        if (this.shouldInitSubscribeFlow) {
            this.rootStore.notificationsStore.initSubscribeFlow();
        }

        this.trackPatternCard();
    }

    updateLang(lang: TSitecoreLangs): void {
        if (lang === this.lang) return;

        this.lang = lang;

        /** Set flatpickr and dayJS locales for provided language */
        localizeFlatpickr(lang);
        const dayJSLocale = localizeDayJS(lang);
        this.changeDateLocale(dayJSLocale);
    }

    @action changeDateLocale(locale: string): void {
        this.dateLocale = locale;
    }

    setPageSearchSortOrder = (): void => {
        if (!this.isSearchResultsPage && !this.isPromoPage) {
            return;
        }

        const searchResults = findComponentByName(this.layout, 'Search Results');
        const sortOrder = (searchResults?.fields as ISearchResultsFields | undefined)?.SortOrders;

        if (sortOrder) {
            this.rootStore.searchStore.setSortConfig(sortOrder);

            // update url with default order for current page
            if (
                !isBackend() &&
                !this.layout?.meta?.shouldRedirect &&
                this.rootStore.routerStore.isSearchResultsPage() &&
                (!this.rootStore.queryParamsStore.orderByFromUrl ||
                    !this.rootStore.queryParamsStore.orderDirectionFromUrl)
            ) {
                this.rootStore.searchStore.clearSortDropdown();
                this.rootStore.routerStore.updateSearchResultsPage();
            }
        }
    };

    @computed get sitePath(): string {
        return `${this.protocol}://${this.domain}${this.basePath}`;
    }

    getSitePathInLang = (lang: string): string => {
        const basePath = buildBasePathByLang(lang, this.isTradePortal);

        return `${this.protocol}://${this.domain}${basePath}`;
    };

    /**
     * Returns current page url for provided language.
     * If there is no page for language then return undefined.
     */
    getPageUrlInLang = (lang: string): string | undefined => {
        // By default getCMSLang() returns 'en' if language is not available in CMS.
        // So we need to pass empty string as default value to get correct page url.
        const cmsLang = getCMSLang(lang, '');

        let pageUrl = cmsLang && this.pageUrls?.[cmsLang];
        pageUrl = pageUrl ? purifyUrl(pageUrl) : undefined;

        return pageUrl;
    };

    @action setFullUrl = (path: string): void => {
        const url = path.startsWith(this.basePath) ? path.replace(this.basePath, '') : path;

        this.fullUrl = this.sitePath + url;
    };

    @action resetLayoutError = (): void => {
        this.isLayoutError = false;
    };

    @action setIsBodyScrollLocked = (isBodyScrollLocke: boolean): void => {
        this.isBodyScrollLocked = isBodyScrollLocke;
    };

    isLivePriceEnabledForDestination = (
        destinationCode: string,
        parents?: IDestination[],
        relatedRegions?: string[],
    ): boolean => {
        const destParents = parents || this.destinationParents;

        return isLivePriceEnabledForDestinationPage(
            destinationCode,
            destParents,
            relatedRegions,
            this.destinationWithoutLivePrice,
        );
    };

    saveSettings = (settings: { [key: string]: any }[] = []): void => {
        settings.forEach(setting => {
            for (const key in setting) {
                this.settings.set(key, setting[key]);
            }
        });
    };

    saveTooltipSettings = (settings?: { Children: IPriceTooltipSitecoreModel[] }): void => {
        this.tooltipSettings = settings?.Children.map(
            x =>
                ({
                    content: x.Content,
                    maxNumberOfGuests: parseInt(`${x.MaxNumberOfGuests}`) || undefined,
                    minNumberOfGuests: parseInt(`${x.MinNumberOfGuests}`) || undefined,
                    noOffer: x.NoOffer === '1',
                } as IPriceTooltipSetting),
        );
    };

    getSetting = <T>(setting: SiteSettings): T | any => this.settings.get(setting);

    getSettingAsNumber = (setting: SiteSettings): number => +this.settings.get(setting);

    getSettingAsDate = (setting: SiteSettings): Nullable<Date> => {
        const dateSetting = this.settings.get(setting);
        const date = dateSetting ? new Date(dateSetting) : null;

        return date && !isNaN(date.getTime()) ? date : null;
    };

    getSettingAsBoolean = (setting: SiteSettings): boolean => {
        const settingsStr = this.settings.get(setting);

        // checkbox from sitecore may come as 0/1 string
        if (settingsStr === '0') {
            return false;
        }

        return !!settingsStr;
    };

    getSettingAsUrlString = (setting: SiteSettings): string =>
        (this.settings.get(setting) as ISitecoreSettingsLink)?.Url || '';

    isPillVisible = (pillCode: SiteSettings, countryCode: string): boolean => {
        const excludedCountries = this.settings.get(pillCode) as string[];

        return excludedCountries ? !excludedCountries.includes(countryCode) : true;
    };

    @computed get isOptimizelyEnabled(): boolean {
        return this.getSettingAsBoolean(SiteSettings.IsOptimizelyExperimentationEnabled);
    }

    @computed get optimizelyUserId(): string {
        return this.getSetting(SiteSettings.OptimizelyUserId) ?? '';
    }

    @computed get optimizelyUserAttributes(): Record<string, any> {
        try {
            const json = this.getSetting(SiteSettings.OptimizelyUserAttributes) ?? '{}';

            return JSON.parse(json);
        } catch {
            return {};
        }
    }

    @computed get optimizelySettingsDecisions(): IOptimizelyDecision[] {
        try {
            const json = this.getSetting(SiteSettings.OptimizelyDecisions) ?? '[]';

            return JSON.parse(json);
        } catch {
            return [];
        }
    }

    @computed get optimizelyComponentDecisions(): IOptimizelyDecision[] {
        return this.context?.optimizelyDecisions ?? [];
    }

    @computed get optimizelyComponentUserId(): string {
        return this.context?.optimizelyUserId ?? '';
    }

    @computed get optimizelyComponentUserAttributes(): Record<string, any> {
        return this.context?.optimizelyUserAttributes ?? {};
    }

    @computed get untrackedOptimizelyComponentDecisions(): IOptimizelyDecision[] {
        return this.optimizelyComponentDecisions.filter(
            decision =>
                !this.trackedOptimizelyComponentFeatureKeys.has(decision.featureKey) &&
                decision.source === OptimizelyDecisionSource.ComponentPersonalization,
        );
    }

    @action addTrackedOptimizelyComponentFeatureKeys = (featureKeys: string[]): void => {
        featureKeys.forEach(key => this.trackedOptimizelyComponentFeatureKeys.add(key));
    };

    @computed get optimizelyClient(): ReactSDKClient | null {
        return this.optimizelyClientInstance;
    }

    @action setOptimizelyClient = (client: ReactSDKClient | null): void => {
        this.optimizelyClientInstance = client;
    };

    isApplySpecialFilter = (key: string, pageName: string): boolean => {
        const includesPage = this.settings.get(key) as string[];

        return includesPage ? includesPage.includes(pageName) : false;
    };

    shouldDisplayStrikethroughPrices = (offer: IOffer): boolean =>
        this.areStrikethroughPricesEnabled && !!getTotalDiscount(offer);

    /**
     * Get dictionary phrase.
     * Dictionary can include other dictionary (e.g. "Call on [GenericMessages.ContactCenterNumberHTML]").
     * Replace them to phrases too.
     * @param key - dictionary key
     */
    getPhrase = (key: string): string => {
        const phrase = this.dictionary.phrases[key];

        return phrase && phrase !== key
            ? phrase.replace(/\[([^\[\]]+)\]/g, (m, dictionary) => this.getPhrase(dictionary))
            : '';
    };

    /**
     * Get plural or singular time unit.
     * @param time - value of time
     * @param config - config describes which dictionary should be used for plural/singular/abbreviation
     * @param useAbbreviation - use short form (e.g. hrs, min)
     */
    getTimeUnitLabel = (time: number, config: ITimeUnitConfig, useAbbreviation?: boolean): string => {
        let dictionary;

        if (time === 0 || time > 1) {
            dictionary = (useAbbreviation && config.abbrPlural) || config.plural;
        } else {
            dictionary = (useAbbreviation && config.abbrSingular) || config.singular;
        }

        return this.getPhrase(dictionary);
    };

    getBreadcrumb = (path: SitePath | string, overloadItem?: SitePathOverload): IBreadcrumb => {
        const dictionary = overloadItem
            ? SitePathDictionaryBreadcrumbOverload[overloadItem]
            : SitePathDictionaryBreadcrumb[path];
        const label = dictionary ? this.getPhrase(dictionary) : '';

        return { value: path, key: label };
    };

    getMicroAppManageBreadcrumb = (path: SitePath): IBreadcrumb => {
        const url = this.rootStore.routerStore.getMicroAppPage(path);

        const { key } = this.getBreadcrumb(path);

        return { value: url, key };
    };

    getDestinationParentBreadcrumb = (): string => {
        const parentBreadcrumb = getSecondLatestOrFirst<IBreadcrumb>(this.pageBreadcrumbs)?.value;

        return parentBreadcrumb ? `${this.sitePath}${parentBreadcrumb}` : '';
    };

    // If personalization cookie was set after save button click, then we need to reload components
    listenToAcceptCookiesClick = (e: MouseEvent): void => {
        if (!e.target) {
            return;
        }

        const element = e.target as Element;

        // check if click happened inside ensighten accept cookies banner
        if (!element.closest('#ensNotifyBanner') && !element.closest('#ensModalWrapper')) {
            return;
        }

        const buttonClicked = element.closest('button#ensSave');

        if (!buttonClicked) {
            return;
        }

        const cookieValue = getCookie(settings.Cookies.Personalization);

        // if personalization cookie was set => we need to reload some components
        if (cookieValue === '1') {
            this.forceReloadComponents();
        }

        document.removeEventListener('click', this.listenToAcceptCookiesClick);
    };

    initializeBasePath = (initialState: ILayoutInitialState): void => {
        const basePath = initialState.basePath || buildBasePathByLang(initialState.lang || 'en', this.isTradePortal);

        this.basePath = basePath;
    };

    /**
     * Reload placeholders data of components with checked ForceReloadChildren param
     */
    forceReloadComponents = async (): Promise<void> => {
        // get components with ForceReloadChildren param. Children (i.e. elements in placeholders) should be reloaded
        const allParentsToReload = findComponentsByParam(this.layout, FORCE_RELOAD_PARAM_NAME);

        // split parents into chunks so we can have fast requests
        const parentsArray = splitArray(allParentsToReload, CHUNK_SIZE);

        const { currentPath } = this;

        const updatePlaceholders = async (parentsToReload: IComponentWithPlaceholder[]): Promise<void> => {
            const innerPlaceholderPaths = getAllPlaceholdersPathsFromParentComponents(parentsToReload);

            try {
                // get updated placeholders data
                const placeholdersData = await sitecoreService.getPlaceholdersLayout(
                    currentPath,
                    innerPlaceholderPaths,
                    this.lang,
                );

                // components update
                runInAction(() => {
                    // abort if page has changed
                    if (currentPath !== this.currentPath) {
                        return;
                    }

                    // update parent components placeholder data
                    parentsToReload.forEach(component => {
                        const componentPlaceholders = component.component.placeholders ?? {};

                        Object.keys(componentPlaceholders).forEach(placeholder => {
                            const placeholderPath = `${component.placeholderPath}/${placeholder}-{${component.component.uid}}-0`;

                            if (placeholdersData[placeholderPath] && componentPlaceholders[placeholder]) {
                                componentPlaceholders[placeholder] = placeholdersData[placeholderPath];
                            }
                        });
                    });

                    this.layout = { ...this.layout };
                });
            } catch (e) {}
        };

        parentsArray.forEach(p => updatePlaceholders(p));
    };

    getFlexDays = (isFlexibleSearch: boolean | undefined): number =>
        isFlexibleSearch ? this.getSettingAsNumber(SiteSettings.NumberOfFlexibleDays) : 0;

    @action setWhenDropdownExperimentTestVariant = (value: string | undefined): void => {
        this.whenDropdownExperimentTestVariant = value;
    };

    @computed get isSearchPodMonthDurationPillsEnabled(): boolean {
        return this.getSettingAsBoolean(SiteSettings.IsSearchPodMonthDurationPillsEnabled);
    }

    //This is for A/B testing and should be removed after go live
    @computed get isSummaryBarHidden(): boolean {
        return this.getSettingAsBoolean(SiteSettings.IsSummaryBarHidden);
    }

    @computed get isTouristTaxEnabled(): boolean {
        return this.getSettingAsBoolean(SiteSettings.IsTouristTaxEnabled);
    }

    @computed get isHolidayPackageCostHighlighted(): boolean {
        return this.getSettingAsBoolean(SiteSettings.IsHolidayPackageCostHighlighted);
    }

    @computed get isMonthSearchEnabled(): boolean {
        if (this.whenDropdownExperimentTestVariant) {
            return ([ExperimentVariants.VariantB, ExperimentVariants.VariantC] as string[]).includes(
                this.whenDropdownExperimentTestVariant,
            );
        }

        return this.getSettingAsBoolean(SiteSettings.IsSearchPodMonthSearchEnabled);
    }

    @computed get isCheapestMonthPriceEnabled(): boolean {
        if (this.whenDropdownExperimentTestVariant) {
            return ([ExperimentVariants.VariantC] as string[]).includes(this.whenDropdownExperimentTestVariant);
        }

        return this.getSettingAsBoolean(SiteSettings.IsSearchCheapestMonthEnabled);
    }

    @computed get shouldShowCheapestMonthTotalPrice(): boolean {
        return this.getSettingAsBoolean(SiteSettings.ShowCheapestMonthTotalPrice);
    }
}
