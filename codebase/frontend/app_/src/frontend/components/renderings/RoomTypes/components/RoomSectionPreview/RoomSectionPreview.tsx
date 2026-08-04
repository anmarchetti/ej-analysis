import React from 'react';

import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { IRoomType } from 'models/data/IHotel';
import { ImageSize } from 'models/enum/ImageSize';
import Button from 'frontend/components/common/Button';
import HotelImage from 'frontend/components/common/HotelImage/HotelImage';
import ShowMoreButton from 'frontend/components/common/ShowMoreButton';
import SvgHotelBedFilled from 'frontend/components/icons-new/HotelBedFilled';
import styles from 'frontend/components/renderings/RoomTypes/components/RoomSectionPreview/RoomSectionPreview.module.scss';

export interface IRoomSectionPreviewProps {
    openPanel: () => void;
    sectionIndex: number;
    showAlternativeRooms: () => void;
    title: string;
    altLabel?: string;
    altRoomsCount?: number;
    openPanelLabel?: string;
    panelLabel?: string | null;
    roomType?: IRoomType;
}

const RoomSectionPreview = (props: IRoomSectionPreviewProps) => {
    const { isScreenMedium, isExtrasPage } = useStore((stores: TStores) => ({
        isScreenMedium: stores.appStore.isScreenMedium,
        isExtrasPage: stores.layoutStore.isExtrasPage,
    }));

    const {
        roomType,
        altRoomsCount,
        altLabel,
        openPanelLabel,
        panelLabel,
        sectionIndex,
        title,
        showAlternativeRooms,
        openPanel,
    } = props;

    if (!roomType) {
        return null;
    }

    return (
        <div
            className={styles.panel}
            data-tid='room-section-preview'
            data-room-section='room-section'
            data-item-index={sectionIndex}
        >
            <div className={styles.panelContainer}>
                {roomType.images?.[0] && (
                    <HotelImage
                        image={roomType.images[0]}
                        defaultSize={ImageSize.Small}
                        className={styles.panelImage}
                    />
                )}

                <div>
                    <div className={styles.panelLabel} data-tid='room-section-preview-panel-label'>
                        <SvgHotelBedFilled className='d-block' />
                        {panelLabel}
                    </div>
                    <h4 className={styles.panelTitle}>
                        <span className={styles.panelName} data-tid='room-section-preview-title'>
                            {title}
                        </span>
                        {isScreenMedium && !isExtrasPage && altLabel && !!altRoomsCount && (
                            <Button
                                className={styles.panelLink}
                                isLink
                                data-tid='room-section-preview-link'
                                onClick={showAlternativeRooms}
                            >
                                {altRoomsCount}&nbsp;{altLabel}
                            </Button>
                        )}
                    </h4>
                </div>
            </div>
            {openPanelLabel && (
                <div className={styles.panelCollapse}>
                    <ShowMoreButton
                        onClick={openPanel}
                        isChevronUp={false}
                        title={isScreenMedium ? openPanelLabel : ''}
                        dataTid='room-section-preview-show-btn'
                    />
                </div>
            )}
        </div>
    );
};

export default RoomSectionPreview;
