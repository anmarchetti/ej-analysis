import React, { FC } from 'react';
import { observer } from 'mobx-react';

import { DATE_FORMATS } from 'code/dates';
import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { formatDateL10n } from 'frontend/utils/date.utils';
import { IBoardType, IHotel } from 'models/data/IHotel';
import { ITransport } from 'models/data/IOffer';
import { IRoute } from 'models/data/IRoute';
import { ITransfer } from 'models/data/ITransfer';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { TransferType } from 'models/enum/transfer/TransferType';
import Button from 'frontend/components/common/Button';
import IconChevronDown from 'frontend/components/icons-new/ChevronDown';
import IconPlainDeparture from 'frontend/components/icons-new/DepartureFilled';
import SvgHoldBagFilled from 'frontend/components/icons-new/HoldBagFilled';
import IconBed from 'frontend/components/icons-new/HotelBedFilled';
import SvgTaxiFilled from 'frontend/components/icons-new/TaxiFilled';
import SvgTransferFilled from 'frontend/components/icons-new/TransferFilled';

import styles from './BookingDetailsCollapsed.module.scss';

export interface IBookingDetailsCollapsedProps {
    board: Nullable<IBoardType>;
    guestsAmount: number;
    hotel: Nullable<IHotel>;
    isShown: boolean;
    onToggle: () => void;
    transfer: Nullable<ITransfer>;
    transport: Nullable<ITransport>;
}

export const BookingDetailsCollapsed: FC<IBookingDetailsCollapsedProps> = ({
    board,
    guestsAmount,
    hotel,
    isShown,
    onToggle,
    transfer,
    transport,
}) => {
    const { getPhrase, totalHoldLuggageItemsNumber, isLuxuryPackage } = useStore(
        ({ layoutStore, bookingStore, viewBookingStore }: TStores) => ({
            getPhrase: layoutStore.getPhrase,
            totalHoldLuggageItemsNumber:
                bookingStore.extraLuggage.totalHoldLuggageItemsNumber ||
                viewBookingStore.extraLuggage.totalHoldLuggageItemsNumber,
            isLuxuryPackage: bookingStore.isLuxuryPackage || viewBookingStore.isLuxuryPackage,
        }),
    );

    if (!isShown) {
        return null;
    }

    const renderRouteInfo = (route: Nullable<IRoute>, dataTid: string): JSX.Element | null =>
        route ? (
            <div data-tid={dataTid}>
                <span className='text-bold'>{route.depPt}</span>{' '}
                {formatDateL10n(route.depDate, DATE_FORMATS.fullDateTime)}
            </div>
        ) : null;

    const getBagTransferIcon = (): JSX.Element | null => {
        if (transfer && transfer.type !== TransferType.NoTransfer) {
            return (
                <>
                    {transfer.type === TransferType.Shared && <SvgTransferFilled />}
                    {transfer.type === TransferType.Private && <SvgTaxiFilled />}
                </>
            );
        }

        if (!!totalHoldLuggageItemsNumber) {
            return <SvgHoldBagFilled />;
        }

        return null;
    };
    const getGuestsAndBoard = (): JSX.Element | null => {
        if (!guestsAmount || !board) {
            return null;
        }

        const text =
            guestsAmount !== 1
                ? getPhrase(SitecoreDictionary.PaymentTitlesGuestsPlural)
                : getPhrase(SitecoreDictionary.PaymentTitlesGuestSingular);

        return <div data-tid='guests-and-board'>{`${guestsAmount} ${text} - ${board.title}`}</div>;
    };
    const bagsTransferIcon = getBagTransferIcon();

    return (
        <div className={styles.header} data-tid='booking-details-collapsed'>
            <div className={styles.column}>
                <IconBed />
                {hotel && (
                    <div data-tid='collapsed-hotel'>
                        <div className='text-bold' data-tid='hotel-name'>
                            {hotel.name}
                        </div>
                    </div>
                )}
                {getGuestsAndBoard()}
            </div>

            <div className={styles.column}>
                <IconPlainDeparture />
                <div>
                    {renderRouteInfo(transport?.routes[0], 'outbound-flight')}
                    {renderRouteInfo(transport?.routes[1], 'inbound-flight')}
                </div>
            </div>
            {!!bagsTransferIcon && (
                <div className={styles.column}>
                    {bagsTransferIcon}

                    {transfer && transfer.type !== TransferType.NoTransfer && (
                        <div data-tid='collapsed-transfer'>
                            <span className='text-bold'>
                                {getPhrase(
                                    isLuxuryPackage
                                        ? SitecoreDictionary.TransferLabelsTitleTransfersPlural
                                        : SitecoreDictionary.TransferLabelsTitleTransferSingular,
                                )}
                            </span>{' '}
                            <span data-tid='transfer-label'>
                                {getPhrase(SitecoreDictionary.LuggageButtonsIncluded)}
                            </span>
                        </div>
                    )}
                    {!!totalHoldLuggageItemsNumber && (
                        <div data-tid='collapsed-bags'>
                            <span className='text-bold'>{getPhrase(SitecoreDictionary.LuggageLabelsLuggage)}</span>{' '}
                            <span data-tid='luggage-label'>{getPhrase(SitecoreDictionary.LuggageButtonsIncluded)}</span>
                        </div>
                    )}
                </div>
            )}

            <div className={styles.buttonWrapper}>
                <Button isText onClick={onToggle} dataTid='expand-toggle'>
                    {getPhrase(SitecoreDictionary.PaymentButtonsViewDetails)} <IconChevronDown />
                </Button>
            </div>
        </div>
    );
};

export default observer(BookingDetailsCollapsed);
