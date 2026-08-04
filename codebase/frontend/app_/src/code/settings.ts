import sanitize from 'sanitize-html';

import { CookiesKeys } from 'models/enum/CookiesKeys';

const settings = {
    RoomAllocation: {
        AdultsInFirstRoom: 2,
        ChildAges: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
    },
    SearchPod: {
        MinCharsTypeAhead: 3,
    },
    Default: {
        page: 1,
        itemsPerPage: 10,
        allowedTags: sanitize.defaults.allowedTags.concat(['style', 'img']),
        allowedSafeTags: ['p', 'br', 'b', 'i', 'em', 'strong'],
        allowedAttributes: false,
        allowedSchemes: ['http', 'https', 'ftp', 'mailto', 'tel'],
        overloadedAttributes: {
            target: '_blank',
            rel: 'noopener noreferrer',
        },
        baseDotCom: 'https://www.easyjet.com',
        scImageClass: 'scEmptyImage', // used to hide default images on RoomTypes
        googleMapsScriptId: '__googleMapsEasyJetHolidays',
        PromoStripeIndex: 2,
    },
    AlternativeFlights: {
        FirstPageFlightsNumber: 2,
        ShowMore: 5,
    },
    HotelDetails: {
        MaxFacilityNumberBeforeBreakdown: 5,
        MinNumberOfFacilitiesInColumn: 6,
        MaxNumberOfTopFacilities: 10,
        FacilitiesPreviewAmountOnMobile: 6,
        HotelDescriptionTruncateOptions: {
            length: 190,
            decodeEntities: true,
            reserveLastWord: true,
            stripTags: true,
        },
    },
    AlternativeRooms: {
        DefaultRoomsToShowDesktop: 2,
        DefaultRoomsToShowMobile: 1,
        defaultMaxVisibleRoomsOnCollapsedState: 3,
        ShowMore: 5,
        RoomSizeFacilityCode: '295',
    },
    ThreeDSecure: {
        challengeWindowSize: '05',
        messageType: 'CReq',
    },
    Animation: {
        DurationMs: 400,
        BodyScrollLockedDelay: 100,
    },
    HeaderMenu: {
        HoverDelay: 350,
    },
    MediaCenter: {
        itemsPerFirstPage: 7,
        itemsPerPage: 9,
        numberOfLatestNews: 4,
    },
    Shortlist: {
        itemsPerPage: 10,
    },
    Booking: {
        countdownMaxDays: 100,
        FacilitiesPreviewGroups: 3,
        FacilitiesPreviewGroupsOnMobile: 2,
        FacilitiesPreviewItemsInGroup: 4,
    },
    Cookies: {
        Personalization: CookiesKeys.EjPersonalisationCookie,
    },
    AmendFlights: {
        itemsPerPage: 3,
    },
    TradePortal: {
        ExportImageSizePx: 500,
    },
};

export default settings;
