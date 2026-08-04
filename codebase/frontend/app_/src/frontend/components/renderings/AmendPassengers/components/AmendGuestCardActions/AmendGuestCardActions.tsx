import React from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { GuestToEdit } from 'models/data/GuestToEdit';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import Button from 'frontend/components/common/Button';
import { IAmendPassengersFields } from 'frontend/components/renderings/AmendPassengers/AmendPassengers';

import styles from './AmendGuestCardActions.module.scss';

interface IAmendGuestCardActionsProps {
    guest: GuestToEdit;
    onClose: () => void;
    disabled?: boolean;
    fields?: IAmendPassengersFields;
}

const AmendGuestCardActions = ({
    guest: { isCheckPending },
    onClose,
    fields,
    disabled,
}: IAmendGuestCardActionsProps) => {
    const { getPhrase, isScreenMedium } = useStore(stores => ({
        getPhrase: stores.layoutStore.getPhrase,
        isScreenMedium: stores.appStore.isScreenMedium,
    }));
    const buttonLabel = isScreenMedium
        ? fields?.SavePassengerDetailsCTA?.value
        : getPhrase(SitecoreDictionary.GlobalsButtonsUpdate);

    return (
        <div
            className={classNames({
                [styles.cardFooterRight]: isScreenMedium,
                ['drawer__actions']: !isScreenMedium,
            })}
        >
            <Button data-tid='form-close' disabled={isCheckPending} onClick={onClose} isTransparent type='button'>
                {getPhrase(SitecoreDictionary.GlobalsButtonsClose)}
            </Button>
            <Button data-tid='form-submit' isLoading={isCheckPending} disabled={disabled} type='submit'>
                {buttonLabel}
            </Button>
        </div>
    );
};

export default observer(AmendGuestCardActions);
