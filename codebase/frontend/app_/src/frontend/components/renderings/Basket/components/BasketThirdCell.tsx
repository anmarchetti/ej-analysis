import React, { FC } from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { getDurationLabel } from 'frontend/utils/accommodation.utils';
import { getHoldItemsLabel } from 'frontend/utils/luggage.utils';
import { isTransferHidden } from 'frontend/utils/transfer.utils';
import { IOfferWithoutAltBoards } from 'models/data/IOffer';
import { ITransfer } from 'models/data/ITransfer';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { TransferType } from 'models/enum/transfer/TransferType';
import BasketDiagonalCellABStyles from 'frontend/components/cro/BasketAB/components/BasketDiagonalCellsAB.module.scss';
import SVGCalendarLined from 'frontend/components/icons-new/CalendarLined';
import SVGHoldBagFilled from 'frontend/components/icons-new/HoldBagFilled';
import SvgTaxiFilled from 'frontend/components/icons-new/TaxiFilled';
import SvgTransferFilled from 'frontend/components/icons-new/TransferFilled';

interface IBasketThirdCellProps {
    className: string;
    offer: IOfferWithoutAltBoards;
    isABTestingComponent?: boolean;
}

export const BasketThirdCell: FC<IBasketThirdCellProps> = ({ className, isABTestingComponent = false, offer }) => {
    const { getPhrase, transfer, isDefaultTransfer, isATOLProtectionEnabled, totalHoldLuggageItemsNumber, infants } =
        useStore((stores: TStores) => ({
            getPhrase: stores.layoutStore.getPhrase,
            transfer: stores.bookingStore.transfer,
            isDefaultTransfer: stores.bookingStore.defaultTransferFromUrl === stores.bookingStore.selectedTransferCode,
            isATOLProtectionEnabled: stores.layoutStore.isATOLProtectionEnabled,
            totalHoldLuggageItemsNumber: stores.bookingStore.extraLuggage.totalHoldLuggageItemsNumber,
            infants: stores.guestDetailsStore.infants,
        }));

    const luggageAmount = totalHoldLuggageItemsNumber + infants.length;
    const holdLuggageLabel = getHoldItemsLabel(luggageAmount, getPhrase);

    return (
        <div
            className={classNames(
                `${className}-cell`,
                isABTestingComponent && `reverse ${BasketDiagonalCellABStyles.thirdCell}`,
            )}
        >
            <ul className='list list--icon '>
                <li className='list-item--icon' data-tid='luggage'>
                    <i className='basket-icon'>
                        <SVGHoldBagFilled />
                    </i>{' '}
                    {holdLuggageLabel}
                </li>

                {transfer?.type === TransferType.Shared && !isTransferHidden([transfer] as ITransfer[]) && (
                    <li className='list-item--icon' data-tid='transfer-shared'>
                        <i className='basket-icon'>
                            <SvgTransferFilled />
                        </i>
                        <span>
                            {isDefaultTransfer
                                ? getPhrase(SitecoreDictionary.TransferLabelsIncluded)
                                : getPhrase(SitecoreDictionary.TransferLabelsSelected)}
                        </span>
                    </li>
                )}

                {transfer?.type === TransferType.Private && !isTransferHidden([transfer] as ITransfer[]) && (
                    <li className='list-item--icon' data-tid='transfer-private'>
                        <i className='basket-icon'>
                            <SvgTaxiFilled />
                        </i>
                        <span>{getPhrase(SitecoreDictionary.TransferLabelsPrivateTransfer)}</span>
                    </li>
                )}

                {isABTestingComponent &&
                    (!transfer ||
                        transfer?.type === TransferType.NoTransfer ||
                        isTransferHidden([transfer] as ITransfer[])) && (
                        <li className='list-item--icon' data-tid='stay-duration'>
                            <i className='basket-icon'>
                                <SVGCalendarLined />
                            </i>
                            <span>{getDurationLabel(getPhrase, offer.stay)}</span>
                        </li>
                    )}

                {!isABTestingComponent && isATOLProtectionEnabled && (
                    <li className='list-item--icon list-item--no-icon' data-tid='atol-protected'>
                        {getPhrase(SitecoreDictionary.HotelDetailsLabelsAtolProtected)}
                    </li>
                )}
            </ul>
        </div>
    );
};

export default observer(BasketThirdCell);
