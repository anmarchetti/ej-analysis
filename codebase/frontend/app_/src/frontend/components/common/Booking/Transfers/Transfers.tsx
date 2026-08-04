import { FunctionComponent } from 'react';
import { ComponentRendering } from '@sitecore-jss/sitecore-jss-nextjs';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { isHolidayStore } from 'frontend/store/holidays';
import { TStores } from 'frontend/store/IStores';
import { ITransfer } from 'models/data/ITransfer';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { TransferType } from 'models/enum/transfer/TransferType';
import TransferItem from 'frontend/components/common/Booking/TransferItem/TransferItem';
import ViewBookingComponentWrapper from 'frontend/components/common/ViewBookingComponentWrapper/ViewBookingComponentWrapper';

interface ITransfersProps {
    rendering: ComponentRendering;
    transfers: ITransfer[];
    isIconOrange?: boolean;
    isPrintPreview?: boolean;
    onAmendTransfersClick?: (e) => void;
}

export const Transfers: FunctionComponent<ITransfersProps> = ({
    transfers,
    isIconOrange,
    isPrintPreview,
    rendering,
    onAmendTransfersClick,
}) => {
    const { isNoAvailableTransfers, getPhrase, setIsUnavailableTransferPopupShown } = useStore((stores: TStores) => ({
        isNoAvailableTransfers: isHolidayStore(stores) && stores.amendTransfersStore.isNoAvailableTransfers,
        setIsUnavailableTransferPopupShown: isHolidayStore(stores)
            ? stores.amendTransfersStore.setIsUnavailableTransferPopupShown
            : null,
        getPhrase: stores.layoutStore.getPhrase,
    }));

    if (!transfers.length) {
        return null;
    }

    const isSingleTransfer = transfers.length === 1;

    const onAmendButtonClick = (e: React.MouseEvent): void => {
        if (isNoAvailableTransfers) {
            setIsUnavailableTransferPopupShown?.(true);

            return;
        }

        onAmendTransfersClick?.(e);
    };

    const renderMultipleTransfers = () => {
        const transfersToShow: ITransfer[] = [];
        let numberOfTaxis = 0;

        // Select to show only Shared and Private transfers (EJH-14380)
        transfers.forEach(el => {
            switch (el.type) {
                /** Show Shared transfers as separate items. */
                case TransferType.Shared:
                    transfersToShow.push(el);
                    break;

                /** Show Taxi as one item */
                case TransferType.Private:
                    !numberOfTaxis && transfersToShow.push(el);
                    numberOfTaxis += el.quantity || 1; // quantity is number of taxis for Private Transfer
                    break;
            }
        });

        return transfersToShow.map(el => (
            <TransferItem
                key={el.id}
                transfer={el}
                isIconOrange={isIconOrange}
                showOccupancy
                rendering={rendering}
                onAmendTransfersClick={onAmendButtonClick}
                isPrintPreview={isPrintPreview}
            />
        ));
    };

    return (
        <ViewBookingComponentWrapper
            dataTid='transfers'
            Title={{
                value: getPhrase(
                    isSingleTransfer
                        ? SitecoreDictionary.TransferLabelsTitleTransferSingular
                        : SitecoreDictionary.TransferLabelsTitleTransfersPlural,
                ),
            }}
            className='confirmed-transfer'
        >
            {isSingleTransfer ? (
                <TransferItem
                    transfer={transfers[0]}
                    isIconOrange={isIconOrange}
                    showOccupancy
                    rendering={rendering}
                    onAmendTransfersClick={onAmendButtonClick}
                    isPrintPreview={isPrintPreview}
                />
            ) : (
                renderMultipleTransfers()
            )}
        </ViewBookingComponentWrapper>
    );
};

export default observer(Transfers);
