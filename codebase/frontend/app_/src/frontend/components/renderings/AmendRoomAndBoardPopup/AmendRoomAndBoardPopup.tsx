import { FC, useEffect } from 'react';
import { Placeholder } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import { getAltRoomsTitle } from 'frontend/utils/boardsAndRooms.utils';
import { PlaceholderNames } from 'models/enum/PlaceholderNames';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import AmendEntityPopup from 'frontend/components/common/AmendEntityPopup/AmendEntityPopup';
import RoomsSection from 'frontend/components/common/Room/RoomsSection/RoomsSection';
import { IAmendRoomAndBoardFields } from 'frontend/components/renderings/AmendRoomAndBoard/AmendRoomAndBoard';

import AmendRoomSkeleton from './components/AmendRoomSkeleton/AmendRoomSkeleton';
import { useRoomAndBoardLocalStore } from './store/createRoomAndBoardLocalStore/createRoomAndBoardLocalStore';

import styles from './AmendRoomAndBoardPopup.module.scss';

const AmendRoomAndBoardPopup: FC<ISitecoreComponent<IAmendRoomAndBoardFields>> = ({ fields, rendering }) => {
    const localStore = useRoomAndBoardLocalStore();

    useEffect(() => {
        if (localStore?.isPopupShown) {
            localStore?.loadRoomAndBoardData();
        }
    }, [localStore?.isPopupShown]);

    const tidPrefix = 'room-and-board-popup';

    if (!fields || !localStore?.isPopupShown) return null;

    const { altRooms, chosenRoom, offersRequest, selectOffer, hidePopup, submitOffer, isSubmitDisabled } = localStore;

    const {
        Title,
        Subtitle,
        OriginalRoomTitle,
        AltRoomsExpandLabel,
        AltRoomsCollapseLabel,
        CountRoomsToShow,
        RoomsMobileListTitle,
        RoomsMobileListDescription,
    } = fields;

    const altRoomsListTitle = getAltRoomsTitle(fields, altRooms);
    const isLoading = offersRequest?.isPending;

    return (
        <AmendEntityPopup
            title={Title}
            subtitle={Subtitle}
            tidPrefix={tidPrefix}
            onClose={hidePopup}
            onConfirm={submitOffer}
            contentClassName={styles.content}
            isConfirmDisabled={isSubmitDisabled}
        >
            <RoomsSection
                rooms={altRooms}
                chosenRoom={chosenRoom}
                showMoreExpandedTitle={AltRoomsExpandLabel?.value}
                originalRoomTitle={OriginalRoomTitle?.value}
                hideMoreCollapsedTitle={AltRoomsCollapseLabel?.value}
                altRoomsTitle={altRoomsListTitle}
                pricePostfix={SitecoreDictionary.PriceSummaryLabelsTotal}
                showRoomsPart={CountRoomsToShow?.value}
                isLoading={isLoading}
                onChangeRoom={selectOffer}
                containerClass={classNames(styles.roomsContainer, { [styles.isLoading]: isLoading })}
                loadingSkeleton={<AmendRoomSkeleton />}
                mobileListMeta={{
                    title: RoomsMobileListTitle.value,
                    description: RoomsMobileListDescription.value,
                }}
            />
            <Placeholder name={PlaceholderNames.BoardTypes} rendering={rendering} />
        </AmendEntityPopup>
    );
};

export default observer(AmendRoomAndBoardPopup);
