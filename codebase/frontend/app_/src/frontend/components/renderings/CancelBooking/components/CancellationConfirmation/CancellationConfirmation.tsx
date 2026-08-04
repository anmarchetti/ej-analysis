import React, { FC, useState } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { isHolidayStore } from 'frontend/store/holidays';
import { TStores } from 'frontend/store/IStores';
import { CreditType } from 'models/enum/CreditType';
import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';
import Button from 'frontend/components/common/Button';
import ConfirmationCheckbox from 'frontend/components/common/ConfirmationInfo/ConfirmationCheckbox';
import RichTextWithLinks from 'frontend/components/common/RichTextWithLinks';
import IconInfoCircle from 'frontend/components/icons/InfoCircle';

import styles from './CancellationConfirmation.module.scss';

export interface ICancellationConfirmationFields {
    ConfirmButtonLabel: ISitecoreField<string>;
    ConfirmationCheckboxDescription: ISitecoreField<string>;
    ImportantInfo: ISitecoreField<string>;
    ImportantInfoTitle: ISitecoreField<string>;
}

export type TCancellationConfirmationProps = {
    fields: ICancellationConfirmationFields;
};

export const CancellationConfirmation: FC<TCancellationConfirmationProps> = ({ fields }) => {
    const [policyConfirmed, setPolicyConfirmed] = useState(false);
    const [showConfirmationError, setShowConfirmationError] = useState(false);

    const {
        creditBooking,
        cancelBooking,
        clearBooking,
        selectedRefundType,
        isCreditBookingLoading,
        isOneTimeUseCreditEnabled,
        isTradePortal,
    } = useStore((stores: TStores) => ({
        creditBooking: isHolidayStore(stores) && stores.holidayCreditStore.creditBooking,
        cancelBooking: stores.holidayCreditStore.cancelBooking,
        clearBooking: stores.viewBookingStore.clearBooking,
        selectedRefundType: isHolidayStore(stores) ? stores.holidayCreditStore.selectedRefundType : undefined,
        isCreditBookingLoading: stores.holidayCreditStore.isCreditBookingLoading,
        isOneTimeUseCreditEnabled: isHolidayStore(stores) ? stores.holidayCreditStore.isOneTimeUseCreditEnabled : false,
        isTradePortal: stores.layoutStore.isTradePortal,
    }));

    const { ImportantInfoTitle, ImportantInfo, ConfirmationCheckboxDescription, ConfirmButtonLabel } = fields;

    const onConfirm = (event?: React.MouseEvent | React.FormEvent): void => {
        if (policyConfirmed) {
            event?.preventDefault();
            clearBooking();
            isOneTimeUseCreditEnabled || isTradePortal
                ? cancelBooking()
                : creditBooking && creditBooking(selectedRefundType === CreditType.Credit);
            setShowConfirmationError(false);
        } else {
            setShowConfirmationError(true);
        }
    };

    const onChangeCheckBox = (): void => {
        setPolicyConfirmed(!policyConfirmed);
        setShowConfirmationError(false);
    };

    return (
        <div className={styles.container} data-tid='cancellation-confirmation'>
            <div className={styles.infoContainer}>
                <div className={styles.infoTitleContainer}>
                    <IconInfoCircle />
                    <Text field={ImportantInfoTitle} tag='h4' className={styles.infoTitle} />
                </div>
                <RichTextWithLinks field={ImportantInfo} />
            </div>
            <ConfirmationCheckbox
                checked={policyConfirmed}
                label={ConfirmationCheckboxDescription}
                onChange={onChangeCheckBox}
                hasError={showConfirmationError}
            />
            <div className={classNames(styles.infoContainer, styles.buttonContainer)}>
                <Button
                    isFullWidth
                    isLarge
                    onClick={onConfirm}
                    hasDisabledStyles={!policyConfirmed}
                    isLoading={isCreditBookingLoading}
                >
                    {ConfirmButtonLabel.value}
                </Button>
            </div>
        </div>
    );
};

export default observer(CancellationConfirmation);
