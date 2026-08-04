import { cmsUrls } from 'code/endpoints';
import { formatDateToQuery } from 'frontend/utils/date.utils';
import { getFlightDigitalNumber } from 'frontend/utils/route.utils';
import { IRoute } from 'models/data/IRoute';
import { ISeatProduct, ISelectedSeat } from 'models/data/ISeatMapStore';
import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';
import { ISeatMapFields } from 'frontend/components/renderings/SeatMap/components/ISeatMapFields';

export const normalizeSeatMapFields = (fields: ISeatMapFields | undefined): ISeatMapFields | undefined => {
    if (!fields) {
        return;
    }

    const normalizedFields: ISeatMapFields = { ...fields };

    // Set full url for all images
    Object.values(normalizedFields).forEach(normalizedField => {
        const src = normalizedField.value?.src;

        if (src) {
            normalizedField.value.src = cmsUrls.media(src);
        }

        if (!Array.isArray(normalizedField)) {
            return;
        }

        normalizedField.forEach((item, i) => {
            if (!item.fields) {
                return;
            }

            const normalizedFieldItem = normalizedField[i];

            Object.entries(item.fields as ISitecoreField<any>[]).forEach(([key, child]) => {
                const src = child.value?.src;

                if (src) {
                    normalizedFieldItem.fields[key].value.src = cmsUrls.media(src);
                }
            });
        });
    });

    return normalizedFields;
};

export const getSelectedSeatsFromWidgetData = (value: ISelectedSeat[], shouldIncludePrice?: boolean): ISelectedSeat[] =>
    value.map((el: ISelectedSeat) => ({
        flightNumber: el.flightNumber,
        sectorId: el.sectorId,
        seats: el.seats?.map(seat => ({
            paxIndex: seat.paxIndex,
            seatNumber: seat.seatNumber,
            products: seat.products,
            ...(shouldIncludePrice && {
                price: seat.price,
                priceBand: seat.priceBand,
            }),
        })),
    }));

export const generateSeatsFlightKey = (flight: IRoute): string => {
    const flightNumber = getFlightDigitalNumber(flight);

    return `${flight.depPt} ${flight.arrPt} ${formatDateToQuery(flight.depDate)} ${flightNumber}`;
};

/**
 * @param fltNo string
 * @param seatNumber string
 * @returns
 */
export const getSeatPrice = (seats: ISelectedSeat[], fltNo?: string, seatNumber?: string): Nullable<number> =>
    seats.find(seatsFlight => seatsFlight.flightNumber === fltNo)?.seats?.find(seat => seat.seatNumber === seatNumber)
        ?.price;

/**
 * @param fltNo string
 * @param seatNumber string
 * @returns
 */
export const getSeatProducts = (seats: ISelectedSeat[], fltNo?: string, seatNumber?: string): ISeatProduct[] =>
    seats.find(seatsFlight => seatsFlight.flightNumber === fltNo)?.seats?.find(seat => seat.seatNumber === seatNumber)
        ?.products || [];
