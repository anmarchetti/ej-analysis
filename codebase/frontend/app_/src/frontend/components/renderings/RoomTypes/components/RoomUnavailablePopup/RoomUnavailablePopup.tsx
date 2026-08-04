import React from 'react';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import Button from 'frontend/components/common/Button';
import { Popup } from 'frontend/components/common/Popup';

export const RoomUnavailablePopup = () => {
    const { isScreenMedium, getPhrase, setRoomUnavailablePopupShown } = useStore(stores => ({
        isScreenMedium: stores.appStore.isScreenMedium,
        getPhrase: stores.layoutStore.getPhrase,
        setRoomUnavailablePopupShown: stores.bookingStore.setRoomUnavailablePopupShown,
    }));

    const hidePopup = () => {
        setRoomUnavailablePopupShown(false);
    };

    return (
        <Popup
            containerClass='holiday-unavailable room-unavailable-popup'
            title={getPhrase(SitecoreDictionary.RoomTypesLabelsRoomUnavailableTitle)}
            onClose={hidePopup}
            isInnerPopup={isScreenMedium}
        >
            <div className='additional-text'>
                {getPhrase(SitecoreDictionary.RoomTypesLabelsRoomUnavailableDescription)}
            </div>
            <Button onClick={hidePopup}>{getPhrase(SitecoreDictionary.GlobalsButtonsOK)}</Button>
        </Popup>
    );
};

export default observer(RoomUnavailablePopup);
