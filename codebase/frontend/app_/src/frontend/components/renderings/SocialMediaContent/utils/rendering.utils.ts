import { DATE_FORMATS } from 'code/dates';
import { MarketStore } from 'frontend/store/base';
import { LayoutStore } from 'frontend/store/holidays';
import { formatDateL10n } from 'frontend/utils/date.utils';
import { distanceInfo, distanceTextFromSitecore, getHotelLocation } from 'frontend/utils/getHotelLocation';
import { isDefined } from 'frontend/utils/object.utils';
import { containsLuxuryPromoCode, filterPackageIcons, getRoomName } from 'frontend/utils/offer.utils';
import { IHotel } from 'models/data/IHotel';
import { IOfferWithoutAltBoards } from 'models/data/IOffer';
import { PackageIconTypes } from 'models/enum/PackageIconTypes';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

export const getImageDataUri = async (srcElementId: string): Promise<Nullable<string>> => {
    try {
        const element = document.getElementById(srcElementId)?.cloneNode(true) as HTMLElement;

        if (!element) {
            return '';
        }

        const getImageDataUri = (await import('lib/generate-pdf')).getImageDataUri;

        return await getImageDataUri(element);
    } catch (e) {
        return null;
    }
};

interface IContentRow {
    icon: string;
    text: Nullable<string>;
}

export const getSocialText = (
    hotel: IHotel,
    priceLabel: string,
    offer: Nullable<IOfferWithoutAltBoards>,
    {
        airportLabel,
        depositLabel,
        getPhrase,
        getFormattedNumber,
        fastTrackSecurityLabel,
    }: {
        airportLabel: Nullable<string>;
        depositLabel: Nullable<string>;
        fastTrackSecurityLabel: Nullable<string>;
        getFormattedNumber: MarketStore['getFormattedNumber'];
        getPhrase: LayoutStore['getPhrase'];
    },
): string => {
    const splitter = '------';
    const newLine = `\n`;

    const { accom, date } = offer || {};
    const distanceLabel =
        (isDefined(hotel.closestFacility?.distance) &&
            distanceInfo(
                hotel.closestFacility,
                distanceTextFromSitecore(hotel.closestFacility, getPhrase, hotel?.theme || accom?.theme),
                false,
                getFormattedNumber,
            )) ||
        null;
    const isLuxury = containsLuxuryPromoCode(offer?.promoCollections);
    const bagName = isLuxury ? getPhrase(SitecoreDictionary.LuggageLabels26kgHoldBagPlural) : undefined;
    const packageIcons = filterPackageIcons(
        offer?.accom.theme?.packageIcons || hotel?.theme?.packageIcons || [],
        offer?.transfers[0],
        offer?.extraLuggageInfo ?? null,
        bagName,
    );
    const transferLabel = packageIcons?.find(icon =>
        [PackageIconTypes.PrivateTransfer, PackageIconTypes.SharedTransfer].includes(icon.key),
    )?.name;
    const bagLabel = packageIcons?.find(
        icon => icon.key === PackageIconTypes.Bags || icon.key === PackageIconTypes.UnderSeatBag,
    )?.name;
    const { boardType, roomType } = accom?.unit[0] || {};
    const roomTypeLabel = roomType && getRoomName(roomType);
    const boardTypeLabel = boardType?.title;
    const fastTrackLabel = isLuxury ? fastTrackSecurityLabel : '';

    const contentBlocks: IContentRow[][] = [
        [
            {
                icon: `🌍`,
                text: getHotelLocation(hotel),
            },
            {
                icon: `🏩`,
                text: hotel.name,
            },
            {
                icon: `🎉`,
                text: priceLabel,
            },
            {
                icon: `🛏`,
                text: [roomTypeLabel, boardTypeLabel].join(', '),
            },
            {
                icon: `🗓`,
                text: formatDateL10n(date, DATE_FORMATS.ordinalDateWithAbbrMonthName),
            },
            {
                icon: `✈️`,
                text: airportLabel,
            },
            {
                icon: `↠`,
                text: fastTrackLabel,
            },
            {
                icon: `${transferLabel ? '🚌' : '🧳'}`,
                text: [bagLabel, transferLabel].filter(Boolean).join(', '),
            },
        ],
        [
            {
                icon: `✅`,
                text: hotel.ksp1,
            },
            {
                icon: `✅`,
                text: hotel.ksp2,
            },
            {
                icon: `✅`,
                text: distanceLabel,
            },
            {
                icon: `🌟`,
                text: depositLabel && `${depositLabel} 🌟`,
            },
        ],
    ];

    return contentBlocks
        .map(block =>
            block
                .filter(item => item.text)
                .map(item => `${item.icon} ${item.text}`)
                .join(newLine),
        )
        .join(`${newLine}${splitter}${newLine}`);
};
