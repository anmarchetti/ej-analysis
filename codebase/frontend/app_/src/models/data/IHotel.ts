import { OfferPromotionCodes } from 'models/enum/OfferPromotionCodes';
import { PackageIconTypes } from 'models/enum/PackageIconTypes';
import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';
export interface IUnitOccupation {
    adults: number;
    childAges: number[];
    children: number;
    infants: number;
    paxIds: number[];
}

export interface IHotel extends IShortenHotel {
    address: string;
    boardTypes: IBoardType[];
    city: string;
    code: string;
    country: IHotelDestination;
    description: string;
    ecoFacility: IEcoFacility;
    errataFacilities: IFacility[];
    facilities: IFacilityGroup[];
    images: IImage[];
    isGreatDeal: boolean;
    keySellingPoint1: string;
    keySellingPoint2: string;
    ksp1: string;
    ksp2: string;
    latitude: string;
    location: IHotelDestination; // region
    longitude: string;
    numberOfReviews: number;
    rating: number;
    resort: IHotelDestination;
    roomTypes: IRoomType[];
    starRating: string;
    strapline: string;
    theme: ITheme;
    tripAdvisorId: string;
    type: IThemeType;
    closestFacilities?: IClosestFacility;
    closestFacility?: IClosestFacility;
    cloudinaryVideoSrc?: string;
    fullHotelAddress?: {
        city: string;
        country: string;
        countryCode: string;
        postalCode: string;
        region: string;
        street: string;
    };
    giataCode?: string;
    /** can appear instead of theme on getting hotel data details on Map component */
    hotelTheme?: {
        code: string;
        name: string;
    };
    languageOfHotel?: string;
    name?: string;
    postalCode?: string;
    promoCollections?: OfferPromotionCodes[];
    thumbnail?: string;
    url?: string;
    videoPlaceholder?: string;
    youtubeVideoId?: string;
}

/** contains only fields that are required for validate-package and commit requests */
export interface IShortenHotel {
    country?: IHotelDestination;
    giataCode?: string;
    hotelType?: IHotelType;
    location?: IHotelDestination;
    name?: string;
    resort?: IHotelDestination;
}

export interface IHotelDestination {
    code: string;
    name: string;
    itemName?: string;
    url?: string;
}

export interface IFacilityGroup {
    code: string;
    description: string;
    iconUrl: string;
    id: string;
    image: IImage;
    items: IFacility[];
    name: string;
    title: string;
}

export interface ISitecoreFacilityGroup extends Omit<IFacilityGroup, 'items'> {
    items: ISitecoreFacility[];
}

export interface ISitecoreVirtualFacilities {
    facilitiesFolderId: string;
    virtualFacilityGroups: ISitecoreFacilityGroup[];
}

export interface IFacility {
    code: string;
    name: string;
    icon?: string;
    id?: string;
    isErrataInfo?: boolean;
    sortOrder?: number;
}

export interface IRoomFacility {
    code: string;
    disclaimerMessage: string;
    name: string;
    number: string;
    id?: string;
}

export interface ISitecoreFacility {
    facilityCode: string;
    name: string;
    id?: string;
}

export interface IEcoFacility {
    name: string;
    tooltip: string;
}

export type TRoomAlteration = Record<string, string | null>;
export type TUnitCodes = { [key: string]: string };

export interface IBoardType {
    code: string;
    content: string;
    description: string;
    iconUrl: string;
    title: string;
    accommodationId?: string;
    discountPercent?: number;
    isExt?: boolean; // for board alteration
    isFreeBoardUpgrade?: boolean;
    isFreeForKids?: boolean;
    itemId?: string;
    itemName?: string; // the same as title but always in English
    name?: string;
    packageId?: string;
    price?: number;
    pricePP?: number;
    roomAlterations?: TRoomAlteration; // for board alteration
    unitCodes?: TUnitCodes;
}

export interface IRoomType {
    code: string;
    content: string;
    description: string;
    facilities: {
        code: string;
        disclaimerMessage: string;
        name: string;
        number: string;
    }[];
    iconUrl: string;
    images: IImage[];
    stays: {
        description: string;
        facilities: {
            code: string;
            name: string;
            number: string;
        }[];
        stayType: string;
    }[];
    title: ISitecoreField<string> | string;
    itemName?: string; // the same as title but always in English
    name?: string;
    roomFacilityFolderId?: string | null;
    roomImagesFolderId?: string | null;
}

export interface IRoom {
    board: string;
    boardType: IBoardType;
    code: string;
    isFreeForKids: boolean;
    occupation: IUnitOccupation;
    roomType: IRoomType;
    avail?: number;
}

export interface IImage {
    large: string;
    medium: string;
    small: string;
    description?: string;
    id?: string;
    selected?: boolean;
}

export interface IClosestFacility {
    code: string;
    distance: number;
    groupCode: string;
    name: string;
}

export interface ITripAdvisor {
    rating: number;
    reviews: number;
}

export interface ITheme {
    code: string;
    name: string;
    packageIcons: IThemePackageIcon[];
    itemName?: string; // the same as name but always in English
}

export interface IThemeType {
    description: string;
    icon: string;
    name: string;
    code?: string;
    filledIcon?: string;
    // the same as name but in english, for analytic non-english markets
    itemName?: string;
    typeAndThemeTitle?: string;
}

// Duplication of IThemeType as theme type will be deleted soon
export interface IHotelType {
    description: string;
    icon: string;
    name: string;
    code?: string;
    filledIcon?: string;
    typeAndThemeTitle?: string;
}

export interface IThemePackageIcon {
    iconUrl: string;
    key: PackageIconTypes;
    name: string;
    luggageCode?: string;
}

export interface IHotelHighlight {
    description?: string;
    image?: string;
    subtitle?: string;
    title?: string;
}
