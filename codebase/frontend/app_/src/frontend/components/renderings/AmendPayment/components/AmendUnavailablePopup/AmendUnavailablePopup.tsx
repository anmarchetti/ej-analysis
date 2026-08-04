import React from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import Button from 'frontend/components/common/Button';
import { Popup } from 'frontend/components/common/Popup';
import { IPaymentPageFields } from 'frontend/components/renderings/AmendPayment/interfaces';

interface IAmendUnavailablePopupProps {
    fields?: IPaymentPageFields;
}

function AmendUnavailablePopup({ fields }: IAmendUnavailablePopupProps) {
    const { isAmendItemUnavailable, onErrorPopupClose, getPhrase } = useStore((stores: IHolidaysStores) => ({
        getPhrase: stores.layoutStore.getPhrase,
        onErrorPopupClose: stores.amendPaymentStore.onErrorPopupClose,
        isAmendItemUnavailable: stores.amendPaymentStore.isAmendItemUnavailable,
    }));

    // we will show separate popup in this case
    if (isAmendItemUnavailable) {
        return null;
    }

    return (
        <Popup containerClass='holiday-unavailable' title={fields?.ErrorPopupTitle?.value ?? ''}>
            {fields?.ErrorPopupDescription && (
                <Text field={fields.ErrorPopupDescription} tag='div' className='additional-text' />
            )}
            <Button onClick={onErrorPopupClose}>
                {fields?.ErrorPopupButton?.value ?? getPhrase(SitecoreDictionary.GlobalsButtonsOK)}
            </Button>
        </Popup>
    );
}

export default observer(AmendUnavailablePopup);
