import React, { FC, useState } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import { observer } from 'mobx-react';

import { Tokens } from 'code/tokens';
import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import { Tokenizer } from 'frontend/utils/tokenizer';
import { ITransfer, ITransferWithAmendmentCharges } from 'models/data/ITransfer';
import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';
import AmendEntityPopup from 'frontend/components/common/AmendEntityPopup/AmendEntityPopup';
import AmendTransferCard from 'frontend/components/renderings/AmendTransfers/components/AmendTransferCard';
import AmendTransfersShimmer from 'frontend/components/renderings/AmendTransfers/components/AmendTransfersShimmer/AmendTransfersShimmer';

import styles from './AmendTransferPopup.module.scss';

export interface ITransferPopupFields {
    TransferPopupAltOptionsPlural: ISitecoreField<string>;
    TransferPopupAltOptionsSingle: ISitecoreField<string>;
    TransferPopupChosenTitle: ISitecoreField<string>;
    TransferPopupSubtitle: ISitecoreField<string>;
    TransferPopupTitle: ISitecoreField<string>;
}

export interface ITransferPopupProps {
    initialTransfer: Nullable<ITransfer>;
    onClose: () => void;
    onConfirm: (transfer: Nullable<ITransferWithAmendmentCharges>) => void;
    altTransfers?: ITransferWithAmendmentCharges[];
    fields?: ITransferPopupFields;
    isLoading?: boolean;
}

const AmendTransferPopup: FC<ITransferPopupProps> = ({
    onClose,
    altTransfers = [],
    initialTransfer,
    fields,
    onConfirm,
    isLoading,
}) => {
    const { currency } = useStore((stores: IHolidaysStores) => ({
        currency: stores.viewBookingStore.booking?.currency?.code,
    }));

    const [selectedTransfer, setSelectedTransfer] = useState<Nullable<ITransferWithAmendmentCharges>>(null);

    if (!fields || !initialTransfer) return null;

    const handleConfirmChange = () => {
        onConfirm(selectedTransfer);
        onClose();
    };

    const isInitialTransferSelected = selectedTransfer ? selectedTransfer.transfer.code === initialTransfer.code : true;

    const altOptionsTitle = Tokenizer.replaceToken(
        altTransfers.length === 1
            ? fields.TransferPopupAltOptionsSingle.value
            : fields.TransferPopupAltOptionsPlural.value,
        Tokens.Amount,
        altTransfers.length.toString(),
    );

    return (
        <AmendEntityPopup
            title={fields.TransferPopupTitle}
            subtitle={fields.TransferPopupSubtitle}
            tidPrefix='change-hotel'
            onClose={onClose}
            onConfirm={handleConfirmChange}
            contentClassName={styles.content}
            isConfirmDisabled={isInitialTransferSelected}
        >
            <Text field={fields.TransferPopupChosenTitle} className={styles.titleChosen} tag='p' />

            {isLoading && <AmendTransfersShimmer />}

            {!isLoading && (
                <>
                    <AmendTransferCard
                        transfer={initialTransfer}
                        onSelect={() => setSelectedTransfer(null)}
                        isSelected={isInitialTransferSelected}
                        revertPrice={(selectedTransfer?.amendmentCharges || -0) * -1}
                        contentClassName={styles.cardContent}
                        className={styles.transferCard}
                        currency={currency}
                        isAmendAppearance
                    />

                    <Text field={{ value: altOptionsTitle }} className={styles.titleAltOptions} tag='p' />

                    {altTransfers.map(amendmentTransfer => (
                        <AmendTransferCard
                            key={amendmentTransfer.transfer.code}
                            transfer={amendmentTransfer.transfer}
                            onSelect={() => setSelectedTransfer(amendmentTransfer)}
                            isSelected={selectedTransfer?.transfer?.code === amendmentTransfer.transfer.code}
                            amendCharge={amendmentTransfer.amendmentCharges}
                            contentClassName={styles.cardContent}
                            className={styles.transferCard}
                            currency={currency}
                            isAmendAppearance
                        />
                    ))}
                </>
            )}
        </AmendEntityPopup>
    );
};

export default observer(AmendTransferPopup);
