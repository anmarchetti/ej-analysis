import { DATE_FORMATS } from 'code/dates';
import { Tokens } from 'code/tokens';
import { LayoutStore } from 'frontend/store/holidays';
import { getDurationLabel } from 'frontend/utils/accommodation.utils';
import { formatDateL10n } from 'frontend/utils/date.utils';
import { getHotelLocation } from 'frontend/utils/getHotelLocation';
import { getSingleRoute } from 'frontend/utils/route.utils';
import { decodeHtmlEntities } from 'frontend/utils/string.utils';
import { Tokenizer } from 'frontend/utils/tokenizer';
import { getTouristTaxPrice, INVALID_TAX_VALUE } from 'frontend/utils/touristTax.utils';
import { IHotel } from 'models/data/IHotel';
import { IOfferWithoutAltBoards } from 'models/data/IOffer';
import { RouteDirection } from 'models/enum/RouteDirection';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
export const getPosterMeta = ({
    hotelInfo,
    offer,
    getPhrase,
}: {
    getPhrase: (srt: SitecoreDictionary) => string;
    hotelInfo: Nullable<IHotel>;
    offer: Nullable<IOfferWithoutAltBoards>;
}) => {
    if (!offer) {
        return null;
    }

    const {
        transport,
        stay,
        accom: { unit, theme },
    } = offer;
    const selectedUnit = unit?.[0];
    const outbound = getSingleRoute(transport.routes.filter(el => el.direction === RouteDirection.Outbound));

    return {
        unit,
        theme,
        hotelLocation: hotelInfo && getHotelLocation(hotelInfo),
        outbound,
        departureDate: outbound ? formatDateL10n(outbound.depDate, DATE_FORMATS.ordinalDateWithAbbrMonthName) : '',
        selectedUnit,
        roomType: selectedUnit?.roomType,
        boardType: selectedUnit?.boardType,
        holidayDuration: getDurationLabel(getPhrase, stay),
    };
};

export const getTouristTaxLabelForPoster = (
    isTouristTaxEnabled: boolean,
    getPhrase: LayoutStore['getPhrase'],
    taxPricePp: number = INVALID_TAX_VALUE,
): string => {
    if (!isTouristTaxEnabled || taxPricePp === INVALID_TAX_VALUE) {
        return '';
    }

    if (!taxPricePp) {
        return `(${decodeHtmlEntities(getPhrase(SitecoreDictionary.TouristTaxLabelsTaxNotApplicable))})`;
    }

    const roundedTaxValue = getTouristTaxPrice(taxPricePp).toString();

    return `(${Tokenizer.replaceToken(
        getPhrase(SitecoreDictionary.TouristTaxLabelsIncludesLocalTaxPerPerson),
        Tokens.Price,
        roundedTaxValue,
    )})`;
};
