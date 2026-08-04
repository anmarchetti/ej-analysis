import React from 'react';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import Button from 'frontend/components/common/Button';
import { Popup } from 'frontend/components/common/Popup';

interface IAmendBookingErrorPopupProps {
    onClose: () => void;
}

export const AmendBookingErrorPopup = ({ onClose }: IAmendBookingErrorPopupProps) => {
    const { getPhrase } = useStore((stores: IHolidaysStores) => ({
        getPhrase: stores.layoutStore.getPhrase,
    }));

    const title = getPhrase(SitecoreDictionary.AmendBookingErrorPopupTitle);
    const description = getPhrase(SitecoreDictionary.AmendBookingErrorPopupDescription);

    return (
        <Popup
            showCloseButton
            isContentCentered
            onClose={onClose}
            title={title}
            footerContent={
                <Button isMedium onClick={onClose}>
                    {getPhrase(SitecoreDictionary.GlobalsButtonsClose)}
                </Button>
            }
        >
            {!!description && <p className='my-0'>{description}</p>}
        </Popup>
    );
};

export default observer(AmendBookingErrorPopup);
