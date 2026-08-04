import React from 'react';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import Button from 'frontend/components/common/Button';
import ShowMoreButton from 'frontend/components/common/ShowMoreButton';
import SvgExternalLink from 'frontend/components/icons-new/ExternalLink';

export interface IRoomSectionButtonProps {
    handleShowMore: () => void;
    isCollapsed: boolean;
    isOriginalRoomChanged: boolean;
    roomsCount: number;
    roomsToShowCount: number;
    visibleRoomsCount: number;
}

const RoomSectionButton = ({
    isCollapsed,
    roomsCount,
    visibleRoomsCount,
    roomsToShowCount,
    handleShowMore,
    isOriginalRoomChanged,
}: IRoomSectionButtonProps) => {
    const { getPhrase, isExtrasPage, isScreenMedium } = useStore((stores: TStores) => ({
        getPhrase: stores.layoutStore.getPhrase,
        isExtrasPage: stores.layoutStore.isExtrasPage,
        isScreenMedium: stores.appStore.isScreenMedium,
    }));

    const isBtnVisible = () => {
        // button is always displayed when more than 2 rooms are available
        if (roomsCount > 2) {
            return true;
        }

        // button is displayed when 2 rooms available to show and when 1 room is displayed in collapsed mode
        // or when original room has been changed
        if (roomsCount === 2 && visibleRoomsCount === 0) {
            return isOriginalRoomChanged || roomsToShowCount === 1;
        }

        // button is not displayed when only one room is available
        // or when 2 rooms are available to show and 2 rooms are displayed in collapsed mode
        return false;
    };

    const isVisible = isBtnVisible();

    if (!isVisible) {
        return null;
    }

    const showMoreLabel = SitecoreDictionary.RoomTypesButtonsShowMore;
    const hideLabel = SitecoreDictionary.RoomTypesButtonsShowLess;
    const editLabel = SitecoreDictionary.RoomTypesLabelsEditRoom;

    const btnCollapsedTitle = isExtrasPage ? editLabel : showMoreLabel;
    const btnTitle = isCollapsed ? btnCollapsedTitle : hideLabel;

    return isScreenMedium ? (
        <ShowMoreButton
            onClick={handleShowMore}
            isChevronUp={!isCollapsed}
            title={getPhrase(btnTitle)}
            dataTid='show-more-rooms-button-desktop'
        />
    ) : (
        <Button
            className='show-more'
            isOutlined
            isFullWidth
            onClick={handleShowMore}
            data-tid='show-more-rooms-button-mobile'
        >
            {getPhrase(btnCollapsedTitle)}
            <SvgExternalLink className='icon-external-link' />
        </Button>
    );
};

export default observer(RoomSectionButton);
