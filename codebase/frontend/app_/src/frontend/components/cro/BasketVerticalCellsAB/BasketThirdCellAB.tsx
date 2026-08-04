import React, { FC } from 'react';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { getHoldItemsLabel } from 'frontend/utils/luggage.utils';
import { isTransferHidden } from 'frontend/utils/transfer.utils';
import { ITransfer } from 'models/data/ITransfer';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { TransferType } from 'models/enum/transfer/TransferType';
import SVGHoldBagFilled from 'frontend/components/icons-new/HoldBagFilled';
import SvgTaxiFilled from 'frontend/components/icons-new/TaxiFilled';
import SvgTransferFilled from 'frontend/components/icons-new/TransferFilled';

export interface IBasketThirdCellABProps {
    className: string;
}

export const BasketThirdCellAB: FC<IBasketThirdCellABProps> = ({ className }) => {
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
        <div className={`${className}-cell`} data-tid='third-cell'>
            <ul className='list list--icon'>
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

                {isATOLProtectionEnabled && (
                    <li className='list-item--icon list-item--no-icon' data-tid='atol-protected'>
                        {getPhrase(SitecoreDictionary.HotelDetailsLabelsAtolProtected)}
                    </li>
                )}
            </ul>
        </div>
    );
};

export default observer(BasketThirdCellAB);
