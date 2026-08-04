import React from 'react';

import { DATE_FORMATS } from 'code/dates';
import { cmsUrls } from 'code/endpoints';
import { Tokens } from 'code/tokens';
import { getRouteByDirection } from 'frontend/utils/airports.utils';
import { formatDateL10n } from 'frontend/utils/date.utils';
import { getNumberOfGuestsByCategory } from 'frontend/utils/guestsValidation';
import { getHoldItemsLabel } from 'frontend/utils/luggage.utils';
import { Tokenizer } from 'frontend/utils/tokenizer';
import { IBoardType, IHotel } from 'models/data/IHotel';
import { IUnit } from 'models/data/IOffer';
import { IRoute } from 'models/data/IRoute';
import { ITransfer } from 'models/data/ITransfer';
import { GuestType } from 'models/enum/GuestType';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { TransferType } from 'models/enum/transfer/TransferType';
import ImageWithFilter, { SVGFilterMatrix } from 'frontend/components/common/ImageWithFilter/ImageWithFilter';
import SVGCalendarLined from 'frontend/components/icons-new/CalendarLined';
import SVGDepartureFilled from 'frontend/components/icons-new/DepartureFilled';
import SVGHoldBagFilled from 'frontend/components/icons-new/HoldBagFilled';
import SVGHotelBedFilled from 'frontend/components/icons-new/HotelBedFilled';
import SVGLocationPinFilled from 'frontend/components/icons-new/LocationPinFilled';
import { IAmendDatesSummaryFields } from 'frontend/components/renderings/AmendDatesSummary/AmendDatesSummary';
import BoardTypeIcon from 'frontend/components/renderings/BoardTypes/components/BoardTypeIcon/BoardTypeIcon';

export interface IGetBasketItemsParams {
    fields: Partial<IAmendDatesSummaryFields>;
    flightRoutes: IRoute[];
    getPhrase: (phrase: string) => string;
    guestsCounts: Record<GuestType, number>;
    hotel: IHotel;
    luggageAmount: number;
    numberOfNights: number;
    transfer: ITransfer;
    board?: IBoardType;
    units?: IUnit[];
}
interface IBasketItem {
    key: string;
    name: React.ReactNode;
    dataTid?: string;
    icon?: React.ReactNode;
}

export const getTransferMetaData = (transfer: ITransfer, getPhrase: (str: string) => string) => {
    const transferIcon = (
        <ImageWithFilter imageSrc={cmsUrls.media(transfer.iconUrl || '')} filterMatrix={SVGFilterMatrix.Grayscale} />
    );
    const isSharedTransportEnabled = transfer?.type === TransferType.Shared && !transfer.isHidden;
    const isPrivateTransportEnabled = transfer?.type === TransferType.Private && !transfer.isHidden;

    const transferLabel = transfer.autoInclude
        ? getPhrase(SitecoreDictionary.TransferLabelsIncluded)
        : getPhrase(SitecoreDictionary.TransferLabelsSelected);

    const result = { icon: transferIcon, name: transfer.name, dataTid: 'no-transfer', key: 'transfer' };

    if (isSharedTransportEnabled) {
        result.name = transferLabel;
        result.dataTid = TransferType.Shared;
    }

    if (isPrivateTransportEnabled) {
        result.dataTid = TransferType.Private;
    }

    return result;
};

export const getNumberOfNightsLabel = (numberOfNights: number, getPhrase: (str: string) => string): string =>
    Tokenizer.replaceToken(
        getPhrase(
            numberOfNights > 1
                ? SitecoreDictionary.GlobalsLabelsNumberOfNights
                : SitecoreDictionary.GlobalsLabelsNumberOfNight,
        ),
        Tokens.Count,
        numberOfNights.toString(),
    );

export const getRoomsCountLabel = (
    singleFormLabel: string,
    pluralFormLabel: string,
    units?: IUnit[],
): string | null => {
    const roomsCount = units?.length;

    if (!roomsCount) {
        return null;
    }

    return Tokenizer.replaceToken(roomsCount > 1 ? pluralFormLabel : singleFormLabel, Tokens.Rooms, String(roomsCount));
};

export const getHotelBasketItem = (hotel: IHotel) => ({
    key: 'hotel',
    icon: <SVGLocationPinFilled />,
    dataTid: 'hotel-location',
    name: (
        <>
            <span className='text-bold text-bold--destination'>{hotel?.resort?.name},</span>{' '}
            <span>{hotel?.name || ''}</span>
        </>
    ) as React.ReactNode,
});

export const getBoardBasketItem = (board: IBoardType) => ({
    key: 'board',
    icon: <BoardTypeIcon iconUrl={board.iconUrl} />,
    name: board.title,
    dataTid: board.code,
});

export const getOutboundFlightItem = (outbound?: IRoute) => {
    const outboundDepartureDate: string = formatDateL10n(outbound?.depDate, DATE_FORMATS.fullDateTime);

    return {
        key: 'departure',
        icon: <SVGDepartureFilled />,
        name: (
            <>
                <span className='text-bold' data-tid='departure-airport'>
                    {outbound?.depPt}
                </span>
                &nbsp;
                <span data-tid='departure-date'>{outboundDepartureDate}</span>
            </>
        ),
    };
};

export const getInboundFlightItem = (inbound?: IRoute) => {
    const inboundDepartureDate: string = formatDateL10n(inbound?.depDate, DATE_FORMATS.fullDateTime);

    return {
        key: 'arrival',
        icon: <SVGDepartureFilled className='icon--reflect-x' />,
        name: (
            <>
                <span className='text-bold' data-tid='arrival-airport'>
                    {inbound?.depPt}
                </span>
                &nbsp;
                <span data-tid='arrival-date'>{inboundDepartureDate}</span>
            </>
        ),
    };
};

export const getNightsBasketItem = (getPhrase: (v: string) => string, numberOfNights: number) => {
    const numberOfNightsLabel = getNumberOfNightsLabel(numberOfNights, getPhrase);

    return {
        key: 'nights',
        icon: <SVGCalendarLined />,
        name: numberOfNightsLabel,
    };
};

export const getBoardTypeBasketItem = (
    {
        guestsCounts,
        singleFormLabel = '',
        pluralFormLabel = '',
        units = [],
    }: { guestsCounts: Record<GuestType, number>; pluralFormLabel?: string; singleFormLabel?: string; units?: IUnit[] },
    getPhrase: (v: string) => string,
) => {
    const guestsLabel = getNumberOfGuestsByCategory(
        getPhrase,
        guestsCounts[GuestType.Adult],
        guestsCounts[GuestType.Child],
        guestsCounts[GuestType.Infant],
    );
    const countRoomWithLabel = getRoomsCountLabel(singleFormLabel, pluralFormLabel, units);

    return {
        key: 'board-type',
        icon: <SVGHotelBedFilled />,
        name: countRoomWithLabel ? `${guestsLabel}, ${countRoomWithLabel}` : guestsLabel,
        dataTid: 'board-room',
    };
};

export const getLuggageBasketItem = (luggageAmount: number, getPhrase: (v: string) => string) => {
    const luggageName = getHoldItemsLabel(luggageAmount, getPhrase);

    if (!luggageName) {
        return null;
    }

    return {
        key: 'luggage',
        icon: <SVGHoldBagFilled />,
        dataTid: 'luggage',
        name: luggageName,
    };
};

export const getFlightsItems = ({ getPhrase, numberOfNights, flightRoutes }: IGetBasketItemsParams) => {
    const { outbound, inbound } = getRouteByDirection(flightRoutes);

    return [
        getOutboundFlightItem(outbound),
        getInboundFlightItem(inbound),
        getNightsBasketItem(getPhrase, numberOfNights),
    ];
};

export const getAccommodationItems = ({
    guestsCounts,
    board,
    units,
    hotel,
    fields,
    getPhrase,
}: IGetBasketItemsParams) => {
    const basketItems: IBasketItem[] = [];

    basketItems.push(getHotelBasketItem(hotel));

    if (board) {
        basketItems.push(getBoardBasketItem(board));
    }

    if (units?.length) {
        basketItems.push(
            getBoardTypeBasketItem(
                {
                    guestsCounts,
                    units,
                    singleFormLabel: fields.RoomSingleLabel?.value,
                    pluralFormLabel: fields.RoomPluralLabel?.value,
                },
                getPhrase,
            ),
        );
    }

    return basketItems;
};

export const getLuggageAndTransportBasketItems = ({ getPhrase, luggageAmount, transfer }: IGetBasketItemsParams) => {
    const basketItems: IBasketItem[] = [];

    const luggageItem = getLuggageBasketItem(luggageAmount, getPhrase);

    if (luggageItem) {
        basketItems.push(luggageItem);
    }

    if (transfer) {
        basketItems.push(getTransferMetaData(transfer, getPhrase));
    }

    basketItems.push({
        key: 'atol',
        name: getPhrase(SitecoreDictionary.HotelDetailsLabelsAtolProtected),
    });

    return basketItems;
};
