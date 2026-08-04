import React, { FunctionComponent } from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import { TStores } from 'frontend/store/IStores';
import { getCurrencyFormatOptions } from 'frontend/utils/summaryDetails.utils';
import { IAirportParking } from 'models/data/externalExtras/IAirportParking';
import { ITransfer } from 'models/data/ITransfer';
import ScrollAnchorId from 'models/enum/ScrollAnchorId';
import { TransferType } from 'models/enum/transfer/TransferType';
import SvgCarRentalLined from 'frontend/components/icons-new/CarRentalLined';
import { ISummaryBarSitecoreFields } from 'frontend/components/renderings/SummaryBar/SummaryBar.interfaces';
import summaryDetailsStyles from 'frontend/components/renderings/SummaryBar/SummaryDetails/SummaryDetails.module.scss';
import SummaryEditButton from 'frontend/components/renderings/SummaryBar/SummaryEditButton/SummaryEditButton';
import transferAndParkingDetailsStyle from 'frontend/components/renderings/SummaryBar/SummaryTransferAndParkingDetails/SummaryTransferAndParkingDetails.module.scss';

interface ISummaryTransferAndParkingDetailsProps extends ISummaryBarSitecoreFields {
    onEditClick?: () => void;
}

const SummaryTransferAndParking: FunctionComponent<ISummaryTransferAndParkingDetailsProps> = ({
    TransferAndParkingTitle,
    TransferAndParkingNoTransfer,
    EnableEditButtons,
    DisableTransferAndParking,
    onEditClick,
}) => {
    const {
        formatMoney,
        transfer,
        transfers,
        selectedAirportParking,
        packageInfo,
        isExternalExtrasEnabled,
        airportParkings,
    } = useStore((stores: TStores & IHolidaysStores) => ({
        formatMoney: stores.marketStore.formatMoney,
        transfer: stores.bookingStore.transfer,
        transfers: stores.bookingStore.transfers,
        selectedAirportParking: stores.airportParkingStore?.selectedAirportParking,
        packageInfo: stores.bookingStore.packageInfo,
        isExternalExtrasEnabled: stores.layoutStore.isExternalExtrasEnabled ?? false,
        airportParkings: stores.airportParkingStore?.airportParkings,
    }));

    if (DisableTransferAndParking?.value) {
        return null;
    }

    const getTransferData = (transfer: Nullable<ITransfer>): { hasTransferData: boolean; transferName: string } => ({
        hasTransferData: transfer != null,
        transferName: formatTransferName(transfer),
    });

    const formatTransferName = (transfer: Nullable<ITransfer>): string => {
        if (!transfer) return '';

        return transfer.type === TransferType.NoTransfer ? TransferAndParkingNoTransfer.value : transfer.name;
    };

    const getParkingData = (
        parking: IAirportParking | null,
    ): { hasParkingData: boolean; parkingCost: string; parkingName: string } => ({
        hasParkingData: parking != null,
        parkingCost: formatMoney(
            parking?.bookingDetails?.totalPrice ?? 0,
            getCurrencyFormatOptions(packageInfo?.paymentInfo?.currency),
        ),
        parkingName: parking?.title ?? '',
    });

    const { hasTransferData, transferName } = getTransferData(transfer);
    const { hasParkingData, parkingName, parkingCost } = getParkingData(selectedAirportParking);

    const hasTransferOptions = transfers?.length;
    const hasParkingOptions = isExternalExtrasEnabled && airportParkings?.length;
    const isEditButtonHidden = !EnableEditButtons?.value || (!hasTransferOptions && !hasParkingOptions);

    if (!hasTransferData && !hasParkingData) return null;

    return (
        <div
            className={classNames(summaryDetailsStyles.category, transferAndParkingDetailsStyle.categoryFlights)}
            data-tid='transfer-and-parking-details'
        >
            <div className={summaryDetailsStyles.titleWrapper}>
                <div className={transferAndParkingDetailsStyle.title}>
                    <SvgCarRentalLined />
                    <h3 data-tid='transfer-and-parking-details-title'>{TransferAndParkingTitle.value}</h3>
                </div>
                <SummaryEditButton
                    dataTid='transfer-and-parking-edit'
                    scrollAnchorId={ScrollAnchorId.Transfer}
                    onClick={onEditClick}
                    isHidden={isEditButtonHidden}
                />
            </div>
            <div className={transferAndParkingDetailsStyle.itemsContainer}>
                {hasTransferData && (
                    <div
                        className={transferAndParkingDetailsStyle.item}
                        data-tid='transfer-and-parking-details-transfer'
                    >
                        <p data-tid='transfer-and-parking-details-transfer-name'>{transferName}</p>
                    </div>
                )}
                {hasParkingData && (
                    <div
                        className={transferAndParkingDetailsStyle.item}
                        data-tid='transfer-and-parking-details-parking'
                    >
                        <p data-tid='transfer-and-parking-details-parking-name'>{parkingName}</p>
                        <p data-tid='transfer-and-parking-details-parking-cost'>{parkingCost}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default observer(SummaryTransferAndParking);
