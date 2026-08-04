import React, { FC, useRef, useState } from 'react';
import { observer } from 'mobx-react';
import scrollIntoViewIfNeeded from 'scroll-into-view-if-needed';

import settings from 'code/settings';
import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { scrollToElement } from 'frontend/utils/ui.utils';
import { IOfferWithoutAltBoards, IUnit } from 'models/data/IOffer';
import { IOriginalRoom } from 'models/data/IOriginalRoom';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import AncillariesTitle from 'frontend/components/common/Ancillaries/components/AncillariesHeader/AncillariesHeader';
import ErrorMessage from 'frontend/components/common/ErrorMessage';
import { STICKY_BOX_ID } from 'frontend/components/common/StickyBox';
import SVGWarningFilled from 'frontend/components/icons-new/WarningFilled';
import RoomAlterations from 'frontend/components/renderings/RoomTypes/components/RoomAlterations/RoomAlterations';
import RoomsDrawer from 'frontend/components/renderings/RoomTypes/components/RoomsDrawer/RoomsDrawer';
import RoomSection from 'frontend/components/renderings/RoomTypes/components/RoomSection/RoomSection';
import { IRoomTypesFields } from 'frontend/components/renderings/RoomTypes/RoomTypes';

export interface IRoomTypesWrapperProps {
    alternativeRooms: IUnit[][];
    fallbackImage: string;
    fields: IRoomTypesFields;
    isLoadingOffer: boolean;
    offer: Nullable<IOfferWithoutAltBoards>;
    onChangeRoom: (index: number, room: IUnit, priceDiff: number, reloadOffer?: boolean) => Promise<void>;
    originalRooms: IOriginalRoom[];
    units: IUnit[];
    failedLoadingOffersAlterations?: boolean;
    onAddImage?: (roomImagesFolderItemId: string | null, callback?, itemId?: string) => void;
    onDeleteItem?: (id: string) => void;
    onUpdateRoom?: (id: string) => void;
    parentItemId?: string;
}

const OFFSET_HEIGHT = 100;

const RoomTypesWrapper: FC<IRoomTypesWrapperProps> = ({
    fields,
    units,
    failedLoadingOffersAlterations,
    originalRooms,
    alternativeRooms,
    fallbackImage,
    offer,
    isLoadingOffer,
    onAddImage,
    onDeleteItem,
    onUpdateRoom,
    onChangeRoom,
}) => {
    const {
        Title,
        TitleMultiple,
        Description,
        RoomUnderSelected,
        TitleNextToSelectedRoomSingular,
        TitleNextToSelectedRoomPlural,
        RoomInformation,
        AlternativeRoomsLabelSingular,
        AlternativeRoomsLabelPlural,
        TitleMobile,
        DescriptionMobile,
        FreeChildPlaceInfoText,
        FreeChildPlaceInfoTitle,
        AlterationInfoTitle,
        AlterationInfoText,
        AlterationExtendedInfoTitle,
        AlterationExtendedInfoText,
        AlterationSubtitle,
        AlterationBoardResultTitle,
        AlterationRoomResultTitle,
        AlterationResultSubtitle,
        AlterationResultRoomsSubtitle,
        AlterationBoardResultTextSingular,
        AlterationRoomResultTextSingular,
        AlterationRoomResultTextPlural,
        AlterationChangingFromTitle,
    } = fields;

    const { isScreenMedium, isExtrasPage, getPhrase } = useStore((stores: TStores) => ({
        isScreenMedium: stores.appStore.isScreenMedium,
        isExtrasPage: stores.layoutStore.isExtrasPage,
        getPhrase: stores.layoutStore.getPhrase,
    }));

    const [isDrawerOpened, setIsDrawerOpened] = useState<boolean>(false);
    const [isOriginalRoomChanged, setIsOriginalRoomChanged] = useState<boolean>(false);
    const [openPanelIndex, setOpenPanelIndex] = useState<number | undefined>(isExtrasPage ? undefined : 0);
    const [drawerDefaultRoomSectionIndex, setDrawerDefaultRoomSectionIndex] = useState<number>(0);

    const isMultipleRoom = units.length > 1;
    const roomsRef = useRef<HTMLDivElement>(null);

    const [priceChange, setPriceChange] = useState<number>(0);
    const [changedRoomSectionIdx, setChangedRoomSectionIdx] = useState<number>(0);
    const [changedRoom, setChangedRoom] = useState<IUnit>();
    const [isAlterationChecked, setAlterationChecked] = useState<boolean>(false);

    const onDrawerClose = (): void => {
        toggleDrawer();
        scrollToSelectedSection(drawerDefaultRoomSectionIndex);
    };

    const setOpenPanel = (panelIndex: number): void => {
        setOpenPanelIndex(panelIndex);
    };

    const toggleDrawer = (): void => {
        setIsDrawerOpened(!isDrawerOpened);
    };

    const editRoomInTheCurrentSection = (roomSectionIndex: number): void => {
        if (!isScreenMedium) {
            setDrawerDefaultRoomSectionIndex(roomSectionIndex);
            toggleDrawer();
        }
    };

    const scrollToRooms = (): void => {
        setTimeout(() => {
            if (roomsRef?.current) {
                scrollIntoViewIfNeeded(roomsRef.current, {
                    behavior: 'smooth',
                    block: 'center',
                });
            }
        });
    };

    const scrollToSelectedSection = (index: number): void => {
        const stickyBarNode = document.getElementById(STICKY_BOX_ID) as HTMLDivElement | null;
        const roomsSectionNodes = document.querySelectorAll(
            '[data-room-section=room-section]',
        ) as NodeListOf<HTMLDivElement> | null;

        let indexToScroll;

        if (roomsSectionNodes?.length) {
            for (let i = 0; i < roomsSectionNodes.length; i++) {
                const roomsSectionIndex = Number(roomsSectionNodes[i]?.getAttribute('data-item-index'));

                if (roomsSectionIndex === index) {
                    indexToScroll = roomsSectionIndex;
                }
            }

            // Scroll to the top of the block after body scroll is unlocked
            setTimeout(() => {
                scrollToElement(roomsSectionNodes[indexToScroll], (stickyBarNode?.offsetHeight || 0) + OFFSET_HEIGHT);
            }, settings.Animation.BodyScrollLockedDelay);
        }
    };

    const handleChangeRoom = async (index: number, room: IUnit, priceDiff: number): Promise<void> => {
        if (!isAlterationChecked) {
            // saving the selected room to check the alterations
            setChangedRoom(room);
            setChangedRoomSectionIdx(index);
            setPriceChange(priceDiff);
            setAlterationChecked(true);

            return;
        }

        await onChangeRoom(index, room, priceDiff);

        setIsOriginalRoomChanged(true);
        setIsDrawerOpened(false);
        setAlterationChecked(false);

        if (isExtrasPage) {
            setOpenPanelIndex(undefined);
            scrollToRooms();
        } else {
            scrollToSelectedSection(index);
        }
    };

    return (
        <div className='board-and-room__separator' data-tid='board-and-room-separator'>
            <section id='rooms' className='board-and-room' data-tid='room-types' ref={roomsRef}>
                <AncillariesTitle
                    title={isMultipleRoom ? TitleMultiple : Title}
                    description={Description}
                    dataTid='board-and-room-head'
                />

                {isMultipleRoom && <div data-tid='delimiter' className='rooms__section-delimiter top' />}

                {failedLoadingOffersAlterations ? (
                    <ErrorMessage
                        icon={<SVGWarningFilled />}
                        message={getPhrase(SitecoreDictionary.RoomTypesLabelsErrorWhileLoading)}
                    />
                ) : (
                    // waiting till originalRooms will be set
                    originalRooms.length > 0 && (
                        <div>
                            {units.map((selectedRoom, selectedRoomSectionIndex) => (
                                <React.Fragment key={`${selectedRoomSectionIndex}_${selectedRoom.code}`}>
                                    <RoomSection
                                        originalRooms={originalRooms}
                                        alternativeRooms={alternativeRooms}
                                        selectedRoom={selectedRoom}
                                        selectedRoomSectionIndex={selectedRoomSectionIndex}
                                        fallbackImage={fallbackImage}
                                        offer={offer}
                                        isLoadingOffer={isLoadingOffer}
                                        nextRoomDisplayOption={RoomUnderSelected?.value}
                                        titleNextToSelectedRoomSingular={TitleNextToSelectedRoomSingular?.value}
                                        titleNextToSelectedRoomPlural={TitleNextToSelectedRoomPlural?.value}
                                        isOriginalRoomChanged={isOriginalRoomChanged}
                                        isMultipleRoomSelected={isMultipleRoom}
                                        isPreview={isMultipleRoom && openPanelIndex !== selectedRoomSectionIndex}
                                        openPanelLabel={RoomInformation?.value}
                                        altLabelSingular={AlternativeRoomsLabelSingular?.value}
                                        altLabelPlural={AlternativeRoomsLabelPlural?.value}
                                        alterationInfoTitle={AlterationInfoTitle}
                                        alterationInfoText={AlterationInfoText}
                                        alterationExtendedInfoTitle={AlterationExtendedInfoTitle}
                                        alterationExtendedInfoText={AlterationExtendedInfoText}
                                        freeChildPlaceInfoTitle={FreeChildPlaceInfoTitle}
                                        freeChildPlaceInfoText={FreeChildPlaceInfoText}
                                        onUpdateRoom={onUpdateRoom}
                                        onChangeRoom={handleChangeRoom}
                                        addImage={onAddImage}
                                        onDeleteItem={onDeleteItem}
                                        editRoomInTheCurrentSection={editRoomInTheCurrentSection}
                                        onCollapseSection={scrollToSelectedSection}
                                        onChangePanel={setOpenPanel}
                                    />

                                    {selectedRoomSectionIndex !== units.length - 1 && (
                                        <div data-tid='delimiter' className='rooms__section-delimiter d-block' />
                                    )}
                                </React.Fragment>
                            ))}
                        </div>
                    )
                )}

                {!isScreenMedium && (
                    <RoomsDrawer
                        title={TitleMobile}
                        description={DescriptionMobile}
                        originalRooms={originalRooms}
                        alternativeRooms={alternativeRooms}
                        fallbackImage={fallbackImage}
                        isLoadingOffer={isLoadingOffer}
                        isOpen={isDrawerOpened}
                        activeRoomSectionIndex={drawerDefaultRoomSectionIndex}
                        alterationInfoTitle={AlterationInfoTitle}
                        alterationInfoText={AlterationInfoText}
                        alterationExtendedInfoTitle={AlterationExtendedInfoTitle}
                        alterationExtendedInfoText={AlterationExtendedInfoText}
                        freeChildPlaceInfoTitle={FreeChildPlaceInfoTitle}
                        freeChildPlaceInfoText={FreeChildPlaceInfoText}
                        onChangeRoom={handleChangeRoom}
                        onClose={onDrawerClose}
                    />
                )}
                <RoomAlterations
                    newRoom={changedRoom}
                    sectionIdx={changedRoomSectionIdx}
                    currentRoom={units[changedRoomSectionIdx]}
                    price={priceChange}
                    fallbackImage={fallbackImage}
                    otherAvailableRoomsCount={alternativeRooms[changedRoomSectionIdx]?.length - 1}
                    isMultipleRoomSelected={isMultipleRoom}
                    subtitle={AlterationSubtitle}
                    boardResultTitle={AlterationBoardResultTitle}
                    roomResultTitle={AlterationRoomResultTitle}
                    resultSubtitle={AlterationResultSubtitle}
                    resultRoomsSubtitle={AlterationResultRoomsSubtitle}
                    boardResultTextSingular={AlterationBoardResultTextSingular}
                    roomResultTextSingular={AlterationRoomResultTextSingular}
                    roomResultTextPlural={AlterationRoomResultTextPlural}
                    changingFromTitle={AlterationChangingFromTitle}
                    freeChildPlaceInfoTitle={FreeChildPlaceInfoTitle}
                    freeChildPlaceInfoText={FreeChildPlaceInfoText}
                    shouldCheckAlteration={isAlterationChecked}
                    onAlterationChecked={(isChecked: boolean): void => setAlterationChecked(isChecked)}
                    onConfirm={handleChangeRoom}
                    onPriceChange={(val: number): void => setPriceChange(val)}
                />
            </section>
        </div>
    );
};

export default observer(RoomTypesWrapper);
