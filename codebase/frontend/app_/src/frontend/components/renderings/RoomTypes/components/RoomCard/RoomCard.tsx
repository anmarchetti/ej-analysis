import React, { FunctionComponent, useEffect, useRef, useState } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-react';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import { SignDisplay } from 'code/currency';
import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { isTradeStore } from 'frontend/store/tradePortal';
import { getRoomName, isRoomPricePPShown } from 'frontend/utils/offer.utils';
import { roomTitleNormalize } from 'frontend/utils/string.utils';
import { getRoomsUrgencyMessageVisibility } from 'frontend/utils/urgencyMessage.utils';
import { IImage, IRoomFacility } from 'models/data/IHotel';
import { IOfferWithoutAltBoards, IUnit } from 'models/data/IOffer';
import { MarketCode } from 'models/data/MarketSettings';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import BlockSelected from 'frontend/components/common/BlockSelected';
import Button from 'frontend/components/common/Button';
import OfferCardSlider from 'frontend/components/common/OfferCardSlider/OfferCardSlider';
import PriceLabel from 'frontend/components/common/PriceLabel/PriceLabel';
import RoomSkeleton from 'frontend/components/common/Room/RoomSkeleton/RoomSkeleton';
import SeoReadMoreTextBlock from 'frontend/components/common/SeoReadMoreTextBlock';
import UrgencyMessage from 'frontend/components/common/UrgencyMessage/UrgencyMessage';
import { useUrgencyMessageText } from 'frontend/components/common/UrgencyMessage/UrgencyMessage.hooks';
import useOptimizelyExperiment from 'frontend/components/cro/ExperimentOptimizely/hooks/useOptimizelyExperiment';
import { experimentConfigs } from 'frontend/components/cro/UrgencyMessageV2EuxAB/testConfig';
import styles from 'frontend/components/renderings/RoomTypes/components/Room.module.scss';
import RoomFacilities from 'frontend/components/renderings/RoomTypes/components/RoomFacilities/RoomFacilities';

import { RoomIndexLabel } from './RoomIndexLabel';

interface IRoomCardProps {
    fallbackImage: string;
    isMultipleRoomSelected: boolean;
    isSelected: boolean;
    offer: Nullable<IOfferWithoutAltBoards>;
    priceDifference: number;
    room: IUnit;
    selectedRoomSectionIndex: number;
    addFacility?: (facilitiesFolderId: string | null, callback?, parentId?: string) => Promise<string | null>;
    className?: string;
    disableFullScreen?: boolean;
    extraActions?: JSX.Element | null;
    getFacilityById?: (itemId: string) => Promise<IRoomFacility | null>;
    getImageByItemId?: (itemId: string) => Promise<IImage | null>;
    infoBlock?: JSX.Element;
    isAlteration?: boolean;
    isLoadingOffer?: boolean;
    isSpoiler?: boolean;
    onAddImage?: (imagesItemId: string | null, callback?, itemId?: string) => void;
    onChangeRoom?: (index: number, newRoom: IUnit, priceDiff: number) => void;
    onDeleteItem?: (id: string) => void;
    sortFacilities?: (itemsIds: string[]) => Promise<void>;
    tooltipClass?: string;
}

const DESCRIPTION_MAX_HEIGHT = 36;

export const RoomCard: FunctionComponent<IRoomCardProps> = ({
    extraActions,
    infoBlock,
    isLoadingOffer,
    isMultipleRoomSelected,
    isSelected,
    isAlteration,
    offer,
    room,
    selectedRoomSectionIndex,
    onChangeRoom,
    onDeleteItem,
    priceDifference,
    tooltipClass,
    ...props
}) => {
    const [roomSkeletonHeight, setRoomSkeletonHeight] = useState<number>();
    const roomRef = useRef<HTMLDivElement>(null);
    const experimentAB = useOptimizelyExperiment(experimentConfigs);

    useEffect(() => {
        if (roomRef?.current) {
            setRoomSkeletonHeight(roomRef.current?.offsetHeight);
        }
    }, []);

    const { isEditMode, isPriceVisible, isScreenMedium, formatMoney, getPhrase, getSettingAsNumber, marketCode } =
        useStore((stores: TStores) => ({
            isPriceVisible: !isTradeStore(stores) || !stores.layoutStore.isPricesHidden,
            isScreenMedium: stores.appStore.isScreenMedium,
            isEditMode: stores.layoutStore.isEditMode,
            formatMoney: stores.marketStore.formatMoney,
            getPhrase: stores.layoutStore.getPhrase,
            getSettingAsNumber: stores.layoutStore.getSettingAsNumber,
            marketCode: stores.marketStore.marketCode,
        }));

    const { urgencyMessageText, urgencyMessageTooltipText } = useUrgencyMessageText({ avail: room.avail ?? 0 });

    const isABVariantTest =
        experimentAB?.activeVariantId && experimentAB.config?.variantA === experimentAB.activeVariantId;
    const isUKMarket = marketCode === MarketCode.UK;

    const { roomType, avail, itemId } = room;

    if (!roomType) {
        return null;
    }

    const isSliderShown = isEditMode || !!roomType.images?.length;
    const isFacilitiesBlockShown = isEditMode || !!roomType.facilities?.length;
    const isCardWithoutFacilitiesAndSlider = !isSliderShown && !isFacilitiesBlockShown;
    const isUrgencyMessageVisible = getRoomsUrgencyMessageVisibility(getSettingAsNumber, avail);

    const cardClassName = classNames('col-12', styles.card, props.className, props.isSpoiler && 'spoiler', {
        [styles.alteration]: isAlteration,
        [styles.selected]: isSelected,
        [styles.cardBrief]: isCardWithoutFacilitiesAndSlider,
    });

    const roomDetailsClassName = classNames(styles.details, 'col-12', {
        [styles.includeSeparator]: isSliderShown,
        'col-sm': isSliderShown,
    });

    const renderTitle = () => {
        const roomName = getRoomName(roomType);
        const titleText = roomTitleNormalize(roomName);

        return (
            <div
                className={classNames('col-md-12', styles.roomsHeader, {
                    [styles.headerWithoutContent]: isCardWithoutFacilitiesAndSlider,
                    [styles.lineSeparator]: isFacilitiesBlockShown || !isSelected,
                })}
                data-tid='room-card-header'
            >
                <div className={styles.roomIndexWrapper}>
                    <RoomIndexLabel offer={offer} selectedRoomSectionIndex={selectedRoomSectionIndex} />
                    {/*EHD-538: Urgency Message wrapper need to improve analytics for Optimazely experiment, this wrapper will removed when the AB experiment ends*/}
                    {isUrgencyMessageVisible && (
                        <span className='urgency-message-wrapper' style={{ marginLeft: 'auto' }}>
                            {(isUKMarket || isABVariantTest) && (
                                <UrgencyMessage
                                    className={styles.UrgencyMessage}
                                    message={urgencyMessageText}
                                    tooltip={urgencyMessageTooltipText}
                                    tooltipClass={tooltipClass}
                                />
                            )}
                        </span>
                    )}
                </div>
                {!!titleText && (
                    <div className={styles.title} data-tid='room-card-title'>
                        {isEditMode ? (
                            <div data-tid='expected-title'>
                                {roomType.code} - Room name: {room.boardType.title}
                            </div>
                        ) : (
                            <Text field={{ value: titleText }} />
                        )}
                    </div>
                )}
            </div>
        );
    };

    const roomTypeDescription = roomType.description;
    const descriptionComponent = (
        <SeoReadMoreTextBlock
            text={roomTypeDescription}
            className={styles.roomDescription}
            overallHeightDesktop={DESCRIPTION_MAX_HEIGHT}
            overallHeightMobile={DESCRIPTION_MAX_HEIGHT}
            hideEmptyHtml
        />
    );

    const renderAction = () =>
        !!onChangeRoom && (
            <div className={styles.action} data-tid='room-card-action'>
                {isSelected ? (
                    <BlockSelected
                        siteCoreKey={SitecoreDictionary.RoomTypesLabelsSelected}
                        className={styles.blockSelected}
                    />
                ) : (
                    <Button
                        className={styles.btn}
                        onClick={() => !!onChangeRoom && onChangeRoom(selectedRoomSectionIndex, room, priceDifference)}
                        dataTid='select-room-button'
                        disabled={isLoadingOffer}
                        isLoading={isLoadingOffer}
                    >
                        {isPriceVisible ? (
                            <PriceLabel
                                tag='span'
                                price={
                                    <span className={styles.btnPrice}>
                                        {formatMoney(priceDifference, {
                                            currency: offer?.currency?.code,
                                            maximumFractionDigits: 0,
                                            signDisplay: SignDisplay.ExceptZero,
                                        })}
                                    </span>
                                }
                                priceDictionary={
                                    isRoomPricePPShown(offer) // EJH-16573: Should NOT render pp when multiple rooms selected
                                        ? SitecoreDictionary.GlobalsPriceLabelsPerPerson
                                        : undefined
                                }
                            />
                        ) : (
                            getPhrase(SitecoreDictionary.AlternativeFlightsButtonsSelect)
                        )}
                    </Button>
                )}
            </div>
        );

    if (isLoadingOffer && isScreenMedium) {
        return (
            <RoomSkeleton
                isLarge={isSelected}
                height={roomSkeletonHeight}
                containerClass={props.isSpoiler ? styles.skeletonSpoiler : undefined}
            />
        );
    }

    return (
        <div
            ref={roomRef}
            className={cardClassName}
            data-tid='room-card'
            {...(isSelected && { 'data-item-selection': 'selected' })}
            {...(props.isSpoiler && { 'data-item-spoiler': 'spoiler' })}
        >
            <div className='no-gutter-row'>
                {isSliderShown && (
                    <div className={classNames(styles.img, 'col-12 col-sm-auto')} data-tid='room-card-img'>
                        <div className='img-carousel-container'>
                            <OfferCardSlider
                                fallbackImage={props.fallbackImage}
                                images={roomType.images}
                                showIndex
                                isEditMode={isEditMode}
                                addImage={props.onAddImage}
                                roomItemId={itemId}
                                roomImagesFolderId={roomType.roomImagesFolderId}
                                deleteImage={onDeleteItem}
                                getImageByItemId={props.getImageByItemId}
                                isFullScreenEnabled={!props.disableFullScreen}
                                isSmallImageVariant
                            />
                        </div>
                    </div>
                )}
                <div className={roomDetailsClassName}>
                    {isCardWithoutFacilitiesAndSlider ? (
                        <div className='row g-0' data-tid='room-card-details-without-facilities-and-slider'>
                            <div
                                data-tid='room-card-title-section'
                                className={classNames(isUrgencyMessageVisible ? 'col-md-12' : 'col-md-8')}
                            >
                                <div className='row'>
                                    {renderTitle()}
                                    {roomTypeDescription && <div className='col-md-12'>{descriptionComponent}</div>}
                                    {extraActions}
                                </div>
                            </div>
                            <div
                                data-tid='room-card-action-section'
                                className={classNames(isUrgencyMessageVisible ? 'col-md-12' : 'col-md-4')}
                            >
                                <div className='row'>
                                    <div
                                        className={classNames('col-md-12', styles.topAction)}
                                        data-tid='room-card-top-action'
                                    >
                                        {renderAction()}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className='row g-0'>
                            {renderTitle()}
                            <div className='col-md-12'>
                                <div className='row'>
                                    <div data-tid='room-card-facilities' className={styles.facilities}>
                                        {isFacilitiesBlockShown && (
                                            <RoomFacilities
                                                key={itemId}
                                                isEditMode={isEditMode}
                                                onDeleteItem={onDeleteItem}
                                                facilities={roomType.facilities}
                                                onSortItems={props.sortFacilities}
                                                addFacility={props.addFacility}
                                                roomFacilityFolderId={roomType.roomFacilityFolderId}
                                                getFacilityById={props.getFacilityById}
                                                roomId={itemId}
                                                tooltipClass={tooltipClass}
                                            />
                                        )}
                                    </div>
                                </div>
                                <div className={styles.bottomSection}>
                                    {roomTypeDescription && descriptionComponent}
                                    {!!offer && (
                                        <div className={styles.bottomAction} data-tid='room-card-bottom-action'>
                                            {renderAction()}
                                        </div>
                                    )}
                                    {extraActions}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
                {infoBlock}
            </div>
        </div>
    );
};

export default observer(RoomCard);
