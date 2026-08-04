import { computed, makeObservable } from 'mobx';

import { Tokens } from 'code/tokens';
import { TRootStore } from 'frontend/store/IStores';
import { isIOS } from 'frontend/utils/browser.utils';
import { getLocationHierarchy } from 'frontend/utils/getLocationHierarchy';
import { Tokenizer } from 'frontend/utils/tokenizer';
import { getPriceWithTouristTax } from 'frontend/utils/touristTax.utils';
import { ILivePrice } from 'models/data/ILivePrice';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import SitecoreTemplateId from 'models/enum/SitecoreTemplateId';
import SiteSettings from 'models/enum/SiteSettings';

export class BaseMetadataStore {
    constructor(public rootStore: TRootStore) {
        makeObservable(this);
    }

    @computed get route() {
        return this.rootStore.layoutStore.layout?.sitecore?.route;
    }

    /** extra data for route, that isn't stored in sitecore (e.g. page title for Hotel details) */
    @computed get extraRouteData() {
        return this.rootStore.layoutStore.layout?.extraRouteData;
    }

    @computed get metaPropertiesFromSettings() {
        if (this.rootStore.layoutStore.isCountryBrowsePage) {
            return {
                title: SiteSettings.CountryTitle,
                description: SiteSettings.CountryDescription,
            };
        }

        if (this.rootStore.layoutStore.isRegionBrowsePage) {
            return {
                title: SiteSettings.RegionTitle,
                description: SiteSettings.RegionDescription,
            };
        }

        if (this.rootStore.layoutStore.isResortBrowsePage) {
            return {
                title: SiteSettings.ResortTitle,
                description: SiteSettings.ResortDescription,
            };
        }

        if (this.rootStore.layoutStore.isHotelDetailsBrowsePage) {
            return {
                title: SiteSettings.HotelTitle,
                description: SiteSettings.HotelDescription,
            };
        }

        return undefined;
    }

    @computed get metaPageTitle(): string {
        const pageTitle = this.extraRouteData?.pageTitle ?? this.route.fields?.PageTitle?.value;
        const { layoutStore } = this.rootStore;

        if (layoutStore.isDynamicPromoPage) {
            return this.replaceDynamicPromoPageTitle(pageTitle);
        }

        if (layoutStore.isHotelDetailsBrowsePage) {
            if (pageTitle) {
                const replacedHotelData = this.replaceHotelData(pageTitle);

                return replacedHotelData;
            }

            const properties = this.metaPropertiesFromSettings;

            if (properties) {
                const replacedName = this.replaceHotelData(layoutStore.getSetting(properties.title));

                return replacedName || '';
            }
        }

        return pageTitle || '';
    }

    @computed get metaPageDescription(): string {
        const description = this.extraRouteData?.pageDescription ?? this.route.fields?.Description?.value;

        if (this.rootStore.layoutStore.isHotelDetailsBrowsePage) {
            if (description) {
                return description;
            }

            const properties = this.metaPropertiesFromSettings;

            if (properties) {
                const replacedDescription = this.replaceDescription(
                    this.rootStore.layoutStore.getSetting(properties.description),
                );

                return replacedDescription || '';
            }
        }

        return description || '';
    }

    @computed get metaCanonical() {
        const { fullUrl, sitePath, isDestinationPage, isHotelDetailsBookPage } = this.rootStore.layoutStore;
        let canonicalUrl = '';

        if (sitePath && this.route.fields.CanonicalUrl?.value) {
            canonicalUrl = `${sitePath}/${this.route.fields.CanonicalUrl.value}`;
        } else if (fullUrl) {
            canonicalUrl = isDestinationPage || isHotelDetailsBookPage ? fullUrl.split('?')[0] : fullUrl;
        }

        // remove trailing slashes and transform to lowercase
        canonicalUrl = canonicalUrl.replace(/\/+$/, '').toLowerCase();

        // urls for ios must be encoded, otherwise share functionality may fail (see http://jra.europe.easyjet.local/browse/EJH-13121)
        canonicalUrl = isIOS() ? encodeURI(canonicalUrl) : canonicalUrl;

        return canonicalUrl;
    }

    @computed get metaGoogleVerification() {
        return this.route.fields['google-site-verification'] ? this.route.fields['google-site-verification'].value : '';
    }

    @computed get metaImage() {
        if (this.extraRouteData?.pageImage) {
            return this.extraRouteData.pageImage;
        }

        return this.route.fields.PageImage?.value?.src ?? '';
    }

    @computed get metaRobots() {
        return this.route.fields.Robots ? this.route.fields.Robots.map(r => r.fields.MetaValue.value).join(', ') : '';
    }

    @computed get metaCategory() {
        return this.route.fields.PageCategory ? this.route.fields.PageCategory.value : '';
    }

    @computed get metaType() {
        return SiteSettings.MetaTypeWebsite;
    }

    replaceName = (content: string): string =>
        Tokenizer.replaceToken(content, Tokens.Name, this.route.fields.Name ? this.route.fields.Name.value : '');

    replaceHotelData = (content: string): string => {
        const hierarchy = getLocationHierarchy(this.rootStore.layoutStore.layout);

        if (hierarchy) {
            return Tokenizer.replaceTokens(content, {
                [Tokens.Name]: this.route.fields.Name?.value || '',
                [Tokens.Resort]: hierarchy.resort?.name || '',
                [Tokens.Region]: hierarchy.region?.name || '',
            });
        }

        return this.replaceName(content);
    };

    private replaceDynamicPromoPageTitle = (content: string): string => {
        const { HotelTheme, HotelThemeType, HolidayThemes } = this.route.fields;
        const typeTitle = HotelThemeType?.[0]?.fields?.DestinationGuideTitle?.value;
        const themeTitle =
            HolidayThemes?.[0]?.fields.Name?.value || HotelTheme?.fields?.DestinationGuideTitle?.value || '';

        return Tokenizer.replaceTokens(content, {
            [Tokens.HolidayTheme]: typeTitle || themeTitle,
            [Tokens.DestinationName]: this.rootStore.promoPageStore.pageDestination?.name || '',
            [Tokens.Season]: this.rootStore.promoPageStore.getSeasonName() ?? '',
        });
    };

    readonly replaceDescription = (content: string): string => {
        const parents = this.rootStore.layoutStore.context?.parents || [];
        const region = parents
            ? parents.find(el => el.type === `{${SitecoreTemplateId.RegionBrowsePage.toUpperCase()}}`)
            : '';
        const resort = parents
            ? parents.find(el => el.type === `{${SitecoreTemplateId.ResortBrowsePage.toUpperCase()}}`)
            : '';

        return Tokenizer.replaceTokens(content, {
            [Tokens.Region]: region ? region.name : '',
            [Tokens.Resort]: resort ? resort.name : '',
            [Tokens.Name]: this.route.fields.Name ? this.route.fields.Name.value : '',
        });
    };

    readonly replaceLivePrice = (content: string, cheapestLivePrice: Nullable<ILivePrice>): string => {
        const isTouristTaxEnabled = this.rootStore.layoutStore.isTouristTaxEnabled;
        const { pricePP = 0, pricePPExcludingTouristTax = 0 } = cheapestLivePrice ?? {};

        const isTouristTaxPriceValid = !!pricePP;
        const priceWithTouristTax = isTouristTaxPriceValid
            ? getPriceWithTouristTax(pricePP, pricePPExcludingTouristTax, isTouristTaxEnabled)
            : 0;
        const isCheapestPriceValid = !!priceWithTouristTax && !!cheapestLivePrice;

        const formattedPrice = isCheapestPriceValid
            ? this.rootStore.marketStore.formatMoney(priceWithTouristTax, {
                  currency: cheapestLivePrice.currency,
                  maximumFractionDigits: 0,
              })
            : '';

        return Tokenizer.replaceTokens(content, {
            [Tokens.LivePriceFrom]: formattedPrice
                ? this.rootStore.layoutStore.getPhrase(SitecoreDictionary.DestinationsLabelsLivePrice)
                : '',
            [Tokens.LivePrice]: formattedPrice,
        });
    };
}

export default BaseMetadataStore;
