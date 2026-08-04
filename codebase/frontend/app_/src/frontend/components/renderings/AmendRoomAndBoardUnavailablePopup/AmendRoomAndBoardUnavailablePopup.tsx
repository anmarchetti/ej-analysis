import { FC } from 'react';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import { IUnavailablePopupFields } from 'models/data/IUnavailablePopup';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import UnavailableFlowPopup from 'frontend/components/common/UnavailableFlowPopup/UnavailableFlowPopup';

const AmendRoomAndBoardUnavailablePopup: FC<ISitecoreComponent<IUnavailablePopupFields>> = ({ fields }) => {
    const { setAreRoomAndBoardVariantsUnavailable, areRoomAndBoardVariantsUnavailable } = useStore(
        (stores: IHolidaysStores) => ({
            setAreRoomAndBoardVariantsUnavailable: stores.amendRoomAndBoardStore.setAreVariantsUnavailable,
            areRoomAndBoardVariantsUnavailable: stores.amendRoomAndBoardStore.areRoomAndBoardVariantsUnavailable,
        }),
    );

    if (!fields || !areRoomAndBoardVariantsUnavailable) {
        return null;
    }

    const onCloseRoomAndBoardUnAvailablePopup = (): void => {
        setAreRoomAndBoardVariantsUnavailable(false);
    };

    return <UnavailableFlowPopup onClose={onCloseRoomAndBoardUnAvailablePopup} fields={fields} />;
};

export default observer(AmendRoomAndBoardUnavailablePopup);
