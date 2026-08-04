import React, { FC } from 'react';
import classNames from 'classnames';

import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { ITransfer } from 'models/data/ITransfer';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { TransferType } from 'models/enum/transfer/TransferType';
import SvgNoTransferFilled from 'frontend/components/icons-new/NoTransferFilled';
import SvgTaxiFilled from 'frontend/components/icons-new/TaxiFilled';
import SvgTransferFilled from 'frontend/components/icons-new/TransferFilled';
import styles from 'frontend/components/renderings/Payment/components/BookingDetailsExpanded/BookingDetailsExpanded.module.scss';

export interface ITransferInfoProps {
    transfer: ITransfer;
    textClassName?: string;
}

const TransferInfo: FC<ITransferInfoProps> = ({ transfer, textClassName }) => {
    const { getPhrase } = useStore((stores: TStores) => ({
        getPhrase: stores.layoutStore.getPhrase,
    }));

    return (
        <div className={styles.blockItem} data-cs-mask>
            {transfer.type === TransferType.Shared && <SvgTransferFilled className={styles.svgIcon} />}
            {transfer.type === TransferType.Private && <SvgTaxiFilled className={styles.svgIcon} />}
            {transfer.type === TransferType.NoTransfer && <SvgNoTransferFilled className={styles.svgIcon} />}

            <div className={classNames(styles.head, textClassName)} data-tid='transfer-name'>
                {transfer.name} {getPhrase(SitecoreDictionary.LuggageButtonsIncluded)}
            </div>
        </div>
    );
};

export default TransferInfo;
