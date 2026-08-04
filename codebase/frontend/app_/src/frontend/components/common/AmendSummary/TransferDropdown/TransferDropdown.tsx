import { FunctionComponent } from 'react';
import { observer } from 'mobx-react';
import sanitize from 'sanitize-html';

import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import { isDefined } from 'frontend/utils/object.utils';
import { ITransfer } from 'models/data/ITransfer';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { ISitecoreField, ISitecoreImage } from 'models/sitecore/generic/ISitecoreField';
import AmendUpsellMessage from 'frontend/components/common/Amend/AmendUpsellMessage/AmendUpsellMessage';
import AmendSummaryAccordion from 'frontend/components/common/AmendSummary/AmendSummaryAccordion/AmendSummaryAccordion';
import EditButton from 'frontend/components/common/AmendSummary/EditButton/EditButton';
import { IButtonProps } from 'frontend/components/common/Button';
import TransferDuration from 'frontend/components/renderings/Transfer/components/TransferDuration/TransferDuration';

import styles from './TransferDropdown.module.scss';

export interface ITransferDropdownProps {
    icon: ISitecoreField<ISitecoreImage>;
    offerTransfer: ITransfer;
    onClickEditCTA: () => void;
    title: ISitecoreField<string>;
    ctaLabel?: string;
    ctaProps?: IButtonProps;
    upgradePrice?: number;
}

const TransferDropdown: FunctionComponent<ITransferDropdownProps> = ({
    icon,
    title,
    offerTransfer,
    upgradePrice,
    onClickEditCTA,
    ctaProps,
    ctaLabel,
}) => {
    const { isAmendPriceEnabledOnViewBookingPage } = useStore((stores: IHolidaysStores) => ({
        isAmendPriceEnabledOnViewBookingPage: stores.amendTransfersStore.isAmendPriceEnabledOnViewBookingPage,
    }));

    if (!offerTransfer) {
        return null;
    }

    const isUpsellMessageShown = isAmendPriceEnabledOnViewBookingPage && isDefined(upgradePrice) && upgradePrice > 0;

    return (
        <AmendSummaryAccordion
            dataTid='amend-summary-transfer'
            icon={icon}
            title={title.value}
            className={styles.amendSummaryTransport}
        >
            <div className={styles.transport}>
                <h4 className={styles.title} data-tid='transfer-dropdown-title'>
                    {offerTransfer.name}
                </h4>
                <TransferDuration duration={offerTransfer.transferInfo?.duration ?? 0} className={styles.duration} />
                {!!offerTransfer.content && (
                    <p
                        className={styles.description}
                        dangerouslySetInnerHTML={{ __html: sanitize(offerTransfer.content) }}
                    />
                )}
            </div>

            <div className='holiday-summary-item__btn-amend no-print'>
                <EditButton onClick={onClickEditCTA} dataTid='amend-summary-transfer-edit-button' {...ctaProps}>
                    {ctaLabel}
                </EditButton>
                {isUpsellMessageShown && (
                    <AmendUpsellMessage
                        price={upgradePrice}
                        priceLabel={SitecoreDictionary.ViewBookingLabelsUpgradeTransfer}
                    />
                )}
            </div>
        </AmendSummaryAccordion>
    );
};

export default observer(TransferDropdown);
