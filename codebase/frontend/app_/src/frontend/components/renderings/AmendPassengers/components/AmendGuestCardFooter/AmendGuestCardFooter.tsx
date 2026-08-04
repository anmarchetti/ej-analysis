import React from 'react';
import classNames from 'classnames';

import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import { GuestToEdit } from 'models/data/GuestToEdit';
import Button from 'frontend/components/common/Button';
import { IAmendPassengersFields } from 'frontend/components/renderings/AmendPassengers/AmendPassengers';
import AmendGuestCardActions from 'frontend/components/renderings/AmendPassengers/components/AmendGuestCardActions/AmendGuestCardActions';

import styles from './AmendGuestCardFooter.module.scss';

interface IAmendGuestCardFooterProps {
    guest: GuestToEdit;
    onCloseCard: () => void;
    onRemovePassenger: () => void;
    disabled?: boolean;
    fields?: IAmendPassengersFields;
}

const AmendGuestCardFooter = ({
    fields,
    guest,
    disabled,
    onRemovePassenger,
    onCloseCard,
}: IAmendGuestCardFooterProps) => {
    const { isScreenMedium, isChangePassengersCountAllowed } = useStore((stores: IHolidaysStores) => ({
        isScreenMedium: stores.appStore.isScreenMedium,
        isChangePassengersCountAllowed: stores.amendPassengerStore.isChangePassengersCountAllowed,
    }));

    return (
        <>
            <div
                className={classNames({
                    [styles.cardFooter]: true,
                    [styles.noChange]: !isChangePassengersCountAllowed,
                })}
            >
                {isChangePassengersCountAllowed && (
                    <Button
                        isTransparent={isScreenMedium}
                        isOutlined={!isScreenMedium}
                        className={styles.removePassengerButton}
                        onClick={onRemovePassenger}
                    >
                        {fields?.RemovePassengerBtnText?.value}
                    </Button>
                )}
                {isScreenMedium && (
                    <AmendGuestCardActions guest={guest} fields={fields} onClose={onCloseCard} disabled={disabled} />
                )}
            </div>
            {!isScreenMedium && (
                <AmendGuestCardActions guest={guest} fields={fields} onClose={onCloseCard} disabled={disabled} />
            )}
        </>
    );
};

export default AmendGuestCardFooter;
