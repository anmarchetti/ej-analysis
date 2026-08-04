/* eslint-disable prefer-arrow/prefer-arrow-functions */
import * as React from 'react';
import { ReactNode } from 'react';
import { computed, makeObservable, observable, runInAction } from 'mobx';
import { inject, observer } from 'mobx-react';

import { isHolidayStore } from 'frontend/store/holidays';
import { TStores } from 'frontend/store/IStores';
import { getLocationHierarchy } from 'frontend/utils/getLocationHierarchy';
import { getDestinationLivePriceByCode } from 'frontend/utils/livePrice.utils';
import { getTouristTaxFieldsFromOffer } from 'frontend/utils/touristTax.utils';
import { IHotel, ITheme, IThemeType } from 'models/data/IHotel';
import { IHotelInfoFields } from 'models/data/IHotelInfoFields';
import { ILivePrice } from 'models/data/ILivePrice';
import { ILocationItem } from 'models/data/ILocationHierarchy';
import { IOffer } from 'models/data/IOffer';
import { ISitecoreLayout } from 'models/data/SitecoreLayout';
import { ShortlistType } from 'models/enum/ShortlistType';
import SiteSettings from 'models/enum/SiteSettings';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import HotelImageCarouselSidebar, {
    IHotelImageSideBarParams,
} from 'frontend/components/renderings/HotelDetails/components/HotelImageCarouselSidebar/HotelImageCarouselSidebar';

export interface IHotelImageSideBarBrowseProps extends ISitecoreComponent<IHotelInfoFields, IHotelImageSideBarParams> {
    getHotelShortlistId: ((code: string) => Promise<string | undefined>) | null;
    getSetting: (setting: string) => string;
    isEditMode: boolean;
    isHolidayStore: boolean;
    isLoggedIn: boolean;
    layout: ISitecoreLayout;
    prices: ILivePrice[];
}

export class HotelImageSideBarBrowse extends React.Component<IHotelImageSideBarBrowseProps> {
    constructor(props: IHotelImageSideBarBrowseProps) {
        super(props);
        makeObservable(this);
    }

    @observable shortListId: string | undefined;

    componentDidMount(): void {
        if (!this.props.isEditMode && this.hotelGiataCode) {
            this.loadHotelShortlistId();
        }
    }

    componentDidUpdate(prevProps: IHotelImageSideBarBrowseProps): void {
        if (!this.props.isEditMode && this.hotelGiataCode) {
            const codeChanged = this.hotelGiataCode !== prevProps.fields?.GiataCode?.value;
            const loginChanged = this.props.isLoggedIn !== prevProps.isLoggedIn;

            if (codeChanged || loginChanged) {
                this.loadHotelShortlistId();
            }
        }
    }

    get hotelCode(): string {
        return this.props.fields?.Code?.value || '';
    }

    get hotelGiataCode(): string {
        return this.props.fields?.GiataCode?.value || '';
    }

    get hotelAccommodationCode(): string {
        return this.props.layout.sitecore.context.accommodationCodes?.[0] || '';
    }

    loadHotelShortlistId = async (): Promise<void> => {
        if (this.props.isLoggedIn) {
            const shortListId = await this.props.getHotelShortlistId?.(this.hotelGiataCode);
            runInAction(() => {
                this.shortListId = shortListId;
            });
        }
    };

    @computed get parsedLocations(): Nullable<{
        country: ILocationItem | undefined;
        location: ILocationItem | undefined;
        resort: ILocationItem | undefined;
    }> {
        const hierarchy = getLocationHierarchy(this.props.layout);

        return hierarchy
            ? {
                  country: hierarchy.country,
                  location: hierarchy.region,
                  resort: hierarchy.resort,
              }
            : null;
    }

    @computed get guestAmount(): number {
        return this.props.prices?.length
            ? this.props.prices[0].searchCriteria.children + this.props.prices[0].searchCriteria.adults
            : 1;
    }

    get closestFacility(): Nullable<{ distance: number | undefined; name: string | undefined }> {
        const closestFacility = this.props.fields?.ClosestFacility?.fields;

        if (closestFacility) {
            return {
                name: closestFacility.FacilityType?.[0]?.fields?.Name?.value,
                distance: closestFacility.Distance?.value,
            };
        }

        return null;
    }

    get theme(): Nullable<ITheme> {
        const themeFields = this.props.fields?.HotelTheme?.fields;

        if (!themeFields) return null;

        return {
            code: themeFields.Code?.value,
            name: themeFields.Name?.value,
            packageIcons: (themeFields.PackageIcons || []).map(packageIcon => {
                const fields = packageIcon?.fields || {};

                return {
                    key: fields.Type?.value,
                    name: fields.Name?.value,
                    iconUrl: fields.Icon?.value?.src,
                    luggageCode: fields.BagType?.fields?.Code?.value,
                };
            }),
        };
    }

    get themeType(): Nullable<IThemeType> {
        const typeFields = this.props.fields?.Types?.[0]?.fields;

        if (!typeFields) return null;

        return {
            code: typeFields.Code?.value,
            name: typeFields.Name?.value,
            description: typeFields.Description?.value,
            icon: typeFields.Icon?.value?.src,
        };
    }

    render(): ReactNode {
        const { fields, layout, params, rendering, getSetting } = this.props;
        const { accommodationCodes } = layout.sitecore.context;

        if (fields) {
            const hotelInfo: IHotel = {
                name: fields.Name,
                code: this.hotelCode,
                giataCode: this.hotelGiataCode,
                ecoFacility: {
                    tooltip: fields.EcoFacility?.Tooltip,
                    name: fields.EcoFacility?.Name,
                },
                starRating: fields.StarRating?.value,
                closestFacility: this.closestFacility,
                strapline: fields.StrapLine,
                ksp1: fields.KeySellingPoint1,
                ksp2: fields.KeySellingPoint2,
                rating: fields.HotelRating ? Number.parseFloat(fields.HotelRating?.value) : null,
                numberOfReviews: fields.TotalNumberOfReviews
                    ? Number.parseInt(fields.TotalNumberOfReviews?.value)
                    : null,
                theme: this.theme,
                type: this.themeType,
                isGreatDeal: fields.GreatDeal?.value,
                ...this.parsedLocations,
            } as any;

            const livePrice = getDestinationLivePriceByCode(this.hotelGiataCode, this.props.prices);
            const { touristTax, touristTaxPP, taxesAndFees } = getTouristTaxFieldsFromOffer(livePrice);

            const offer = {
                accom: {
                    code: this.hotelAccommodationCode,
                },
                hotel: {
                    name: fields.Name?.value,
                    giataCode: this.hotelGiataCode,
                    code: this.hotelCode,
                    theme: this.theme,
                    type: this.themeType,
                },
                price: livePrice?.price ?? 0,
                pricePP: livePrice?.pricePP ?? 0,
                priceExcludingTouristTax: livePrice?.priceExcludingTouristTax ?? 0,
                pricePPExcludingTouristTax: livePrice?.pricePPExcludingTouristTax ?? 0,
                touristTax,
                touristTaxPP,
                taxesAndFees,
                shortlist: {
                    id: this.shortListId,
                    type: ShortlistType.Hotel,
                },
                transfers: this.props.prices[0]?.transfers,
                extraLuggageInfo: livePrice ? this.props.prices[0]?.extraLuggageInfo ?? null : undefined,
            } as IOffer;

            return (
                <HotelImageCarouselSidebar
                    hotelInfo={hotelInfo}
                    offer={offer}
                    accommodationCodes={accommodationCodes}
                    isPreview
                    reviewsAnchor={params.reviewsAnchor || ''}
                    rendering={rendering}
                    duration={
                        getSetting(SiteSettings.EnableNumberOfNightsLabel)
                            ? livePrice?.searchCriteria.duration
                            : undefined
                    }
                />
            );
        }

        return null;
    }
}

export default inject((stores: TStores) => ({
    layout: stores.layoutStore.layout,
    isEditMode: stores.layoutStore.isEditMode,
    getSetting: stores.layoutStore.getSetting,
    isLoggedIn: stores.userStore.isLoggedIn,
    getHotelShortlistId: isHolidayStore(stores) ? stores.shortlistStore.getHotelShortlistId : null,
}))(observer(class WrappedHotelImageSideBarBrowse extends HotelImageSideBarBrowse {}));
