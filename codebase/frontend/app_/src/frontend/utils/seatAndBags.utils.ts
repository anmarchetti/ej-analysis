import { NEGATIVE_INDEX } from 'code/commonNumbers';
import { Tokens } from 'code/tokens';
import { getFullPassengerName } from 'frontend/utils/passenger.utils';
import { Tokenizer } from 'frontend/utils/tokenizer';
import { IFlightPassenger, IPassengerFlights } from 'models/data/AncillariesInfo';
import { IGuestPassenger } from 'models/data/ILeadPassenger';
import { IOffer, IOfferWithoutAltBoards } from 'models/data/IOffer';
import { ISeatMapRow, ISelectedSeat, ISelectedSeatDetails, TSelectedSeatsFromQuery } from 'models/data/ISeatMapStore';
import { IPassengerFields } from 'models/data/ISeatsAndBagsFields';
import { ISitecoreChildren } from 'models/data/ISitecoreChildren';
import { sectorIds } from 'models/data/SeatsSectorIds';
import { GuestType } from 'models/enum/GuestType';
import { PassengerDisplayName } from 'models/enum/PassengerType';
import { QueryParamName } from 'models/enum/QueryParamName';
import { SeatColor } from 'models/enum/SeatColor';
import { SeatType } from 'models/enum/SeatType';
import { ISitecoreField, ISitecoreImage } from 'models/sitecore/generic/ISitecoreField';
import { IAncillariesPersonDetailsProps } from 'frontend/components/common/AncillariesPersonDetails/AncillariesPersonDetails';

import { getFlightDigitalNumber } from './route.utils';

export const getLCBPriceLabel = (price: string, field?: ISitecoreField<string>): string =>
    Tokenizer.replaceToken(field?.value, Tokens.Price, price);

export const getSeatsPriceInfo = (seatDescription: string, price: string): string =>
    Tokenizer.replaceTokens(seatDescription, {
        [Tokens.SeatPrice]: price,
    });

export const formatPriceToTwoDecimalPlaces = (price?: number): string =>
    (price && isFinite(price) ? price : 0).toFixed(2).toString();

export const getTitleConstant = (
    passengerIndex: number,
    titleConstantValue: Nullable<string>,
    additionalTokens?: {
        [key: string]: string;
    },
): string =>
    Tokenizer.replaceTokens(titleConstantValue, {
        [Tokens.PassengerIndex]: passengerIndex.toString(),
        ...additionalTokens,
    });

export const getTitle = (
    passengerName: string,
    titleValue: Nullable<string>,
    additionalTokens?: {
        [key: string]: string;
    },
): string =>
    Tokenizer.replaceTokens(titleValue, {
        [Tokens.PassengerIndex]: '',
        [Tokens.PassengerName]: passengerName,
        ...additionalTokens,
    });

export const getPassengerByDisplayName = (
    children: ISitecoreChildren<IPassengerFields>[],
    type: PassengerDisplayName,
): IPassengerFields | undefined => children.find(item => item.displayName === type)?.fields;

export const getChildInfo = (
    childTitleConstant: Nullable<string>,
    childTitle: Nullable<string>,
    personIcon: Nullable<ISitecoreField<ISitecoreImage>>,
): IAncillariesPersonDetailsProps => {
    if (!childTitle && !childTitleConstant) {
        return {
            title: '',
            titleConstant: '',
            age: '',
            personIcon,
        };
    }

    const childTitleInfo = childTitle?.split(/ (?=\()/);
    const childTitleConstantInfo = childTitleConstant?.split(/ (?=\()/);

    return {
        title: childTitleInfo?.[0],
        titleConstant: childTitleConstantInfo?.[0],
        age: childTitleConstantInfo?.[1] || childTitleInfo?.[1],
        personIcon,
    };
};

export const getPersonProps = (
    outboundPassenger: IFlightPassenger,
    children: ISitecoreChildren<IPassengerFields>[],
    numberOfPerson: number,
    getPhrase: (key: string) => string,
): IAncillariesPersonDetailsProps | void => {
    const { withInfant, type } = outboundPassenger;

    if (type === GuestType.Child) {
        const childFields = getPassengerByDisplayName(children, PassengerDisplayName.Child);

        if (!childFields) {
            return;
        }

        const childAgeToken = {
            [Tokens.PassengerAge]: outboundPassenger.age?.toString() || '',
        };
        const childTitle = getTitle(
            getFullPassengerName(outboundPassenger, getPhrase),
            childFields.Title?.value,
            childAgeToken,
        );
        const childTitleConstant = getTitleConstant(numberOfPerson, childFields.TitleConstant?.value, childAgeToken);

        return getChildInfo(childTitleConstant, childTitle, childFields.Icon);
    }

    if (type === GuestType.Adult) {
        const passengerFields = getPassengerByDisplayName(
            children,
            withInfant ? PassengerDisplayName.AdultInfant : PassengerDisplayName.Adult,
        );

        if (!passengerFields) {
            return;
        }

        return {
            personIcon: passengerFields.Icon,
            titleConstant: getTitleConstant(numberOfPerson, passengerFields.TitleConstant?.value),
            title: getTitle(getFullPassengerName(outboundPassenger, getPhrase), passengerFields.Title?.value),
        };
    }
};

export const getAdultsWithInfants = (
    outBoundPassengers: IFlightPassenger[],
    inBoundPassengers: IFlightPassenger[],
): IPassengerFlights[] => {
    const adultsWithInfants: IPassengerFlights[] = [];

    for (let index = 0; index < outBoundPassengers.length; index++) {
        if (outBoundPassengers[index].withInfant) {
            adultsWithInfants.push({
                outboundPassenger: { ...outBoundPassengers[index] },
                inboundPassenger: {
                    ...inBoundPassengers.find(person => {
                        if (person.passengerId === outBoundPassengers[index].passengerId) {
                            return person;
                        }

                        return null;
                    }),
                },
            });
        }
    }

    return adultsWithInfants;
};

export const getAdultsWithoutInfants = (
    outBoundPassengers: IFlightPassenger[],
    inBoundPassengers: IFlightPassenger[],
): IPassengerFlights[] => {
    const adults: IPassengerFlights[] = [];

    for (let index = 0; index < outBoundPassengers.length; index++) {
        if (outBoundPassengers[index].type === GuestType.Adult && !outBoundPassengers[index].withInfant) {
            adults.push({
                outboundPassenger: { ...outBoundPassengers[index] },
                inboundPassenger: {
                    ...inBoundPassengers.find(person => {
                        if (person.passengerId === outBoundPassengers[index].passengerId) {
                            return person;
                        }

                        return null;
                    }),
                },
            });
        }
    }

    return adults;
};

export const getChildren = (
    outBoundPassengers: IFlightPassenger[],
    inBoundPassengers: IFlightPassenger[],
): IPassengerFlights[] => {
    const children: IPassengerFlights[] = [];

    for (let index = 0; index < outBoundPassengers.length; index++) {
        if (outBoundPassengers[index].type === GuestType.Child) {
            children.push({
                outboundPassenger: { ...outBoundPassengers[index] },
                inboundPassenger: {
                    ...inBoundPassengers.find(person => {
                        if (person.passengerId === outBoundPassengers[index].passengerId) {
                            return person;
                        }

                        return null;
                    }),
                },
            });
        }
    }

    return children;
};

export const getSeatBorderColor = (priceBand?: SeatType): SeatColor => {
    if (priceBand === SeatType.ExtraLegroom) {
        return SeatColor.Green;
    }

    if (priceBand === SeatType.UpFront) {
        return SeatColor.Blue;
    }

    return SeatColor.Orange;
};

const getCheapestSeatsPriceArray = (rows: ISeatMapRow[]): number[] => {
    const seatsFrom: number[] = [];

    rows.forEach(row => {
        row.blocks.forEach(block => {
            block.seats.forEach(seat => {
                const price = seat.price;

                if (!seatsFrom.includes(price)) {
                    seatsFrom.push(price);
                }
            });
        });
    });

    return seatsFrom;
};

const getCheapestExtraLegRoomPriceArray = (rows: ISeatMapRow[]): number[] => {
    const extraLegsRoom: number[] = [];

    rows.forEach(row => {
        if (row.priceBandName === SeatType.ExtraLegroom) {
            row.blocks.forEach(block => {
                block.seats.forEach(seat => {
                    const price = seat.price;

                    if (!extraLegsRoom.includes(price)) {
                        extraLegsRoom.push(price);
                    }
                });
            });
        }
    });

    return extraLegsRoom;
};

export const getCheapestExtraLegRoomPrice = (rows1: ISeatMapRow[], rows2: ISeatMapRow[]): number => {
    if (rows1 === undefined || rows2 === undefined) {
        return 0;
    }

    const extraLegsRoomDeparture = getCheapestExtraLegRoomPriceArray(rows1);
    const extraLegsRoomReturn = getCheapestExtraLegRoomPriceArray(rows2);

    if (!extraLegsRoomDeparture.length && !extraLegsRoomReturn.length) {
        return 0;
    }

    return Math.min(...extraLegsRoomDeparture, ...extraLegsRoomReturn);
};

export const getCheapestSeatsPrice = (rows1: ISeatMapRow[], rows2: ISeatMapRow[]): number => {
    if (rows1 === undefined || rows2 === undefined) {
        return 0;
    }

    const seatsFromDeparture = getCheapestSeatsPriceArray(rows1);
    const seatsFromReturn = getCheapestSeatsPriceArray(rows2);

    if (!seatsFromDeparture.length && !seatsFromReturn.length) {
        return 0;
    }

    return Math.min(...seatsFromDeparture, ...seatsFromReturn);
};

export const getCheapestSeats = (
    rows: ISeatMapRow[] = [],
    ignoredSeats: string[] = [],
): { cheapestExtraLegRoomPrice?: number; cheapestSeatPrice?: number } => {
    const info: { cheapestExtraLegRoomPrice?: number; cheapestSeatPrice?: number } = {
        cheapestExtraLegRoomPrice: undefined,
        cheapestSeatPrice: undefined,
    };

    rows.forEach(row => {
        row.blocks.forEach(block => {
            block.seats.forEach(seat => {
                if (!seat.isAvailable || ignoredSeats.includes(seat.number)) {
                    return;
                }

                if (seat.priceBand === SeatType.ExtraLegroom) {
                    info.cheapestExtraLegRoomPrice =
                        seat.price < (info.cheapestExtraLegRoomPrice ?? Infinity)
                            ? seat.price
                            : info.cheapestExtraLegRoomPrice;

                    return;
                }

                info.cheapestSeatPrice =
                    seat.price < (info.cheapestSeatPrice ?? Infinity) ? seat.price : info.cheapestSeatPrice;
            });
        });
    });

    return info;
};

// Passengers with infants
export const getPassengersWithInfants = (guests: IFlightPassenger[] | IGuestPassenger[]): IFlightPassenger[] => {
    const passengers: IFlightPassenger[] = guests.map(passenger => ({
        ...passenger,
        withInfant: false,
        passengerId: passenger.index,
    }));

    let infantCount = 0;

    const adultPassengers = passengers.filter(passenger => {
        if (passenger.type === GuestType.Infant) {
            infantCount++;

            return false;
        }

        return true;
    });

    return addInfantsToAdultPassengers(adultPassengers, infantCount);
};

export const addInfantsToAdultPassengers = (
    passengers: IFlightPassenger[],
    numberOfInfants: number,
): IFlightPassenger[] =>
    passengers.map(passenger => {
        if (passenger.type === GuestType.Adult && numberOfInfants > 0) {
            numberOfInfants--;

            return {
                ...passenger,
                withInfant: true,
            };
        }

        return passenger;
    });

export const getPassengersWithAncillaries = (
    passengers: IFlightPassenger[],
    seatSelection: ISelectedSeat[],
    flightNumber: string,
    lcbSelection?: string[],
): IFlightPassenger[] => {
    const flight = seatSelection.find(el => el.flightNumber === flightNumber);
    const seats = flight?.seats;
    const hasSeatsSelection = !!seats?.length;
    const hasCabinBagsSelection = !!lcbSelection?.length;

    if (!hasSeatsSelection && !hasCabinBagsSelection) {
        return passengers;
    }

    const seatsByPaxIndex = {};

    if (hasSeatsSelection) {
        seats.forEach(seat => {
            seatsByPaxIndex[seat.paxIndex] = {
                ...seat,
                products: seat.products ?? [],
                // always set to Standard if price band is empty (EJH-16335)
                priceBand: seat.priceBand || SeatType.Standard,
            };
        });
    }

    return passengers.map(pax => {
        const updatedPax = { ...pax };

        if (hasSeatsSelection) {
            updatedPax.seat = seatsByPaxIndex[+(pax.index ?? NEGATIVE_INDEX)];
        }

        if (hasCabinBagsSelection) {
            updatedPax.hasLCB = Boolean(pax.passengerId && lcbSelection.indexOf(pax.passengerId) > NEGATIVE_INDEX);
        }

        return updatedPax;
    });
};

export const parseAncString = (data?: string): string[] => (data?.length ? data.split('|') : []);

export const parseSeats = (data: TSelectedSeatsFromQuery): ISelectedSeat[] =>
    sectorIds.map(defaultSectorId => ({
        sectorId: defaultSectorId,
        seats:
            parseAncString(data[`${QueryParamName.SeatsSectorIdPrefix}${defaultSectorId}`])
                .filter(seat => !!seat)
                .map(seat => ({
                    paxIndex: Number(seat.split('-')?.[0]) || 0,
                    seatNumber: seat.split('-')?.[1],
                })) || [],
    }));

export const generateSeatsSelectedStructure = (seats: ISelectedSeat[]): ISelectedSeat[] =>
    seats.map(el => ({
        flightNumber: el.flightNumber || '',
        sectorId: el.sectorId,
        seats: (el.seats || []).map(seat => ({
            paxIndex: seat.paxIndex ?? 0,
            seatNumber: seat.seatNumber,
        })),
    }));

export const countSum = (seats: ISelectedSeatDetails[]): number => {
    if (!seats?.length || seats.find((seat: ISelectedSeatDetails) => typeof seat.price === 'undefined')) {
        return 0;
    }

    return seats.reduce((sum, value: ISelectedSeatDetails) => sum + (value?.price ?? 0), 0);
};

/**
 * When data fetched from "/offers"
 * paxIndex and sectorId are missing
 * populate seats with paxIndexes and sectorIds from URL
 * If seat is invalid, it's not received from /offers
 * that's why we use stored seats as a basis
 * @param fetchedOffer
 * @param storedSelections
 * @returns undefined | ISelectedSeat[] // seat selection that includes missing data
 */
export const getOfferWithPopulatedData = (
    fetchedOffer: IOffer | IOfferWithoutAltBoards,
    storedSelections?: ISelectedSeat[],
): ISelectedSeat[] | undefined => {
    if (!storedSelections || !fetchedOffer.seatSelection?.length || fetchedOffer.transport.routes.length < 2) {
        return;
    }

    const flightNumsBySectors = {
        1: getFlightDigitalNumber(fetchedOffer.transport.routes[0]), // fetchedOutboundFlightNum
        2: getFlightDigitalNumber(fetchedOffer.transport.routes[1]), // fetchedInboundFlightNum
    };

    return storedSelections.reduce((acc, storedSelection) => {
        const fetchedSelection = fetchedOffer.seatSelection?.find(
            fetchedSeatsDetails =>
                fetchedSeatsDetails.flightNumber &&
                flightNumsBySectors[storedSelection.sectorId] === fetchedSeatsDetails.flightNumber,
        );

        if (!fetchedSelection) {
            return [...acc, storedSelection];
        }

        const mergeSeatDetails = (storedSeat: ISelectedSeatDetails) => ({
            ...storedSeat,
            ...getFetchedSeat(storedSeat.seatNumber),
            paxIndex: storedSeat.paxIndex, // paxIndex is not coming from API
        });

        const getFetchedSeat = (seatNumber: string) =>
            fetchedSelection?.seats?.find(fetchedSeat => fetchedSeat.seatNumber === seatNumber);

        return [
            ...acc,
            {
                ...fetchedSelection,
                seats: storedSelection.seats?.map(mergeSeatDetails),
                sectorId: storedSelection.sectorId, // sectorId is not coming from API
            },
        ];
    }, [] as ISelectedSeat[]);
};

/**
 * if seat has changed
 * Adds secondary display style
 * And force set price (difference) 0
 * As user is not paying for updated price of unchanged seats
 * @param newSelection
 * @param prevSelection
 * @returns
 */
export const handleUnchangedSeats = (
    newSelection: IPassengerFlights[],
    prevSelection: IPassengerFlights[],
): IPassengerFlights[] =>
    newSelection.map((newSelectionItem, index) => {
        for (const key in newSelectionItem) {
            if (
                newSelectionItem[key]?.seat?.seatNumber &&
                newSelectionItem[key].seat.seatNumber === prevSelection[index]?.[key]?.seat?.seatNumber
            ) {
                newSelectionItem[key].seat.hasSecondaryStyle = true;
                newSelectionItem[key].seat.price = 0;
            }
        }

        return newSelectionItem;
    });

/**
 * Converts ISelectedSeat[] into IPassengerFlights[]
 * @param params
 * @returns
 */
export const getSeatMapInfoFromSelectedSeats = (params: {
    guests: IGuestPassenger[];
    inboundFlightNum: string;
    outboundFlightNum: string;
    seatSelection: ISelectedSeat[];
}): IPassengerFlights[] => {
    const outboundPassengers = getPassengersWithAncillaries(
        getPassengersWithInfants(params.guests),
        params.seatSelection,
        params.outboundFlightNum,
    );
    const inboundPassengers = getPassengersWithAncillaries(
        getPassengersWithInfants(params.guests),
        params.seatSelection,
        params.inboundFlightNum,
    );

    return outboundPassengers.map((passenger, index) => ({
        outboundPassenger: passenger,
        inboundPassenger: inboundPassengers[index], // TODO make sure order is the same
    }));
};

export const isPremiumSeat = (priceBand?: SeatType): boolean =>
    !!priceBand && [SeatType.UpFront, SeatType.ExtraLegroom].includes(priceBand);
