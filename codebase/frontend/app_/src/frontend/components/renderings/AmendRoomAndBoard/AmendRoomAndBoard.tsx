import { useLayoutEffect } from 'react';
import { Placeholder } from '@sitecore-jss/sitecore-jss-nextjs';
import { observer } from 'mobx-react';

import { useMobileViewport } from 'frontend/hooks/useMediaQuery';
import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import { areRoomVariantsEqual } from 'frontend/store/holidays/amend/amendRoomAndBoard/AmendRoomAndBoardStore.utils';
import { getAmendmentRoundedPrice } from 'frontend/utils/amendBooking.utils';
import { getAltRoomsTitle } from 'frontend/utils/boardsAndRooms.utils';
import { IUnit } from 'models/data/IOffer';
import { GuestType } from 'models/enum/GuestType';
import { PlaceholderNames } from 'models/enum/PlaceholderNames';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { EventTypes } from 'models/enum/tracking/EventTypes';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';
import AmendPageHeader from 'frontend/components/common/AmendPageHeader/AmendPageHeader';
import OverlaySpinner from 'frontend/components/common/OverlaySpinner';
import { IRoomCardsListProps } from 'frontend/components/common/Room/RoomCardsList/RoomCardsList';
import RoomSection from 'frontend/components/common/Room/RoomsSection/RoomsSection';
import RoomAndBoardBasket from 'frontend/components/renderings/AmendmentBasket/components/RoomAndBoardBasket/RoomAndBoardBasket';
import AmendRoomAndBoardFooter from 'frontend/components/renderings/AmendRoomAndBoard/components/AmendRoomAndBoardFooter/AmendRoomAndBoardFooter';
import AmendRoomAndBoardHeader from 'frontend/components/renderings/AmendRoomAndBoard/components/AmendRoomAndBoardHeader/AmendRoomAndBoardHeader';
import ComponentWrapper from 'frontend/components/renderings/static/ComponentWrapper';

import styles from './AmendRoomAndBoard.module.scss';

export interface IAmendRoomAndBoardFields {
    AdditionalCostLabel: ISitecoreField<string>;
    AltRoomsCollapseLabel: ISitecoreField<string>;
    AltRoomsExpandLabel: ISitecoreField<string>;
    AltRoomsTitle: ISitecoreField<string>;
    AltRoomsTitlePlural: ISitecoreField<string>;
    CountRoomsToShow: ISitecoreField<number>;
    FreeChildPlaceTooltip: ISitecoreField<string>;
    GoBackLabel: ISitecoreField<string>;
    GoBackNoChangesLabel: ISitecoreField<string>;
    OriginalRoomTitle: ISitecoreField<string>;
    PriceTooltipContent: ISitecoreField<string>;
    RefundAmountLabel: ISitecoreField<string>;
    RoomsListTitle: ISitecoreField<string>;
    RoomsMobileListDescription: ISitecoreField<string>;
    RoomsMobileListTitle: ISitecoreField<string>;
    Subtitle: ISitecoreField<string>;
    Title: ISitecoreField<string>;
}

const AmendRoomAndBoard: React.FC<ISitecoreComponent<IAmendRoomAndBoardFields>> = ({ fields, rendering }) => {
    const {
        isLoading,
        roomVariants,
        changeRoom,
        validateRoomVariants,
        initiateRoomAndBoardPage,
        chosenRoom,
        chosenBoard,
        cancelRequests,
        isLoadingFromPayload,
        getPhrase,
        areNoValidatedOptions,
        redirectToViewBookingPage,
        trackNewRoomOrBoardClick,
        booking,
        chosenRoomVariant,
        confirmChosenVariant,
        isOriginalVariantChosen,
    } = useStore((stores: IHolidaysStores) => ({
        roomVariants: stores.amendRoomAndBoardStore.roomVariants,
        isLoading: stores.amendRoomAndBoardStore.isLoadingValidatedOptions,
        changeRoom: stores.amendRoomAndBoardStore.changeRoom,
        validateRoomVariants: stores.amendRoomAndBoardStore.validateRoomVariants,
        initiateRoomAndBoardPage: stores.amendRoomAndBoardStore.initiateRoomAndBoardPage,
        chosenRoom: stores.amendRoomAndBoardStore.chosenRoom,
        chosenBoard: stores.amendRoomAndBoardStore.chosenBoard,
        cancelRequests: stores.amendRoomAndBoardStore.cancelRequests,
        isLoadingFromPayload: stores.viewBookingStore.isLoadingBookingFromPayload,
        getPhrase: stores.layoutStore.getPhrase,
        redirectToViewBookingPage: stores.routerStore.redirectToViewBookingPage,
        areNoValidatedOptions: stores.amendRoomAndBoardStore.areOptionsNotValidated,
        trackNewRoomOrBoardClick: stores.trackingStore.roomAndBoard.trackNewRoomOrBoardClick,
        chosenRoomVariant: stores.amendRoomAndBoardStore.chosenRoomVariant,
        confirmChosenVariant: stores.amendRoomAndBoardStore.confirmChosenVariant,
        isOriginalVariantChosen: stores.amendRoomAndBoardStore.isOriginalVariantChosen,
        booking: stores.viewBookingStore.booking,
    }));

    const isMobile = useMobileViewport();

    const onChangeRoom = async (room: IUnit): Promise<void> => {
        const { roomType } = room;
        trackNewRoomOrBoardClick(
            EventTypes.PostBookingChangeRoomSelect,
            roomType.itemName || (typeof roomType.title === 'string' ? roomType.title : roomType.title.value),
            Math.round(room.price),
        );
        changeRoom(room);
        await validateRoomVariants();
    };

    useLayoutEffect(() => {
        initiateRoomAndBoardPage();

        return cancelRequests;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if (!fields || !booking) {
        return null;
    }

    const {
        Title,
        Subtitle,
        OriginalRoomTitle,
        AltRoomsExpandLabel,
        AltRoomsCollapseLabel,
        CountRoomsToShow,
        RoomsMobileListDescription,
        RoomsMobileListTitle,
        AdditionalCostLabel,
        GoBackLabel,
        GoBackNoChangesLabel,
        RefundAmountLabel,
        PriceTooltipContent,
        FreeChildPlaceTooltip,
    } = fields;

    // Constructs rooms and only shows those that have the chosen board type and are not the chosen room
    const rooms = roomVariants.reduce((acc: IUnit[], room) => {
        const unit = {
            ...room.units[0],
            price: getAmendmentRoundedPrice(room.units[0].price),
        };

        if (room.boardType === chosenBoard?.code && !areRoomVariantsEqual(unit, chosenRoom as IUnit)) {
            return [...acc, unit];
        }

        return acc;
    }, []);

    const mobileListMeta: IRoomCardsListProps['mobileListMeta'] = {
        title: RoomsMobileListTitle?.value,
        description: RoomsMobileListDescription?.value,
    };

    const altRoomsListTitle = getAltRoomsTitle(fields, rooms);
    const isChildInBooking = booking.guests.some(({ type }) => type === GuestType.Child);
    const freeChildPlaceMeta = isChildInBooking
        ? {
              freeChildPlaceTooltip: FreeChildPlaceTooltip?.value,
              countryCode: booking.hotel?.country.code,
          }
        : {};

    return (
        <>
            <div data-tid='amend-room-and-board' className={styles.container}>
                <AmendRoomAndBoardHeader
                    additionalCostLabel={AdditionalCostLabel.value}
                    refundAmountLabel={RefundAmountLabel.value}
                    priceTooltipContent={PriceTooltipContent}
                />
                <AmendPageHeader title={Title} subtitle={Subtitle} rendering={rendering} isAttentionMessageOn />

                <ComponentWrapper>
                    <Placeholder name={PlaceholderNames.ChangeFeeInfo} rendering={rendering} />

                    <Placeholder name={PlaceholderNames.BoardTypes} rendering={rendering} {...freeChildPlaceMeta} />

                    <RoomSection
                        onChangeRoom={onChangeRoom}
                        rooms={rooms}
                        chosenRoom={chosenRoom}
                        showMoreExpandedTitle={AltRoomsExpandLabel?.value}
                        originalRoomTitle={OriginalRoomTitle?.value}
                        hideMoreCollapsedTitle={AltRoomsCollapseLabel?.value}
                        altRoomsTitle={altRoomsListTitle}
                        pricePostfix={SitecoreDictionary.PriceSummaryLabelsTotal}
                        showRoomsPart={CountRoomsToShow?.value}
                        isLoading={isLoading}
                        mobileListMeta={mobileListMeta}
                        rendering={rendering}
                        {...freeChildPlaceMeta}
                    />

                    <AmendRoomAndBoardFooter
                        additionalCostLabel={AdditionalCostLabel.value}
                        refundAmountLabel={RefundAmountLabel.value}
                        goBackLabel={GoBackLabel.value}
                        goBackNoChangesLabel={GoBackNoChangesLabel.value}
                        priceTooltipContent={PriceTooltipContent}
                    />
                </ComponentWrapper>
                {isMobile && (
                    <Placeholder
                        name={PlaceholderNames.MobileBasket}
                        rendering={rendering}
                        price={getAmendmentRoundedPrice(chosenRoomVariant?.fullAmendmentCharges ?? 0)}
                        hasOptionSelected={!isOriginalVariantChosen}
                        handleSubmit={confirmChosenVariant}
                    >
                        <RoomAndBoardBasket units={chosenRoomVariant?.units} />
                    </Placeholder>
                )}
            </div>
            {isLoadingFromPayload && (
                <OverlaySpinner header={getPhrase(SitecoreDictionary.GlobalsLabelsValidatingPackage)} />
            )}
            {areNoValidatedOptions && (
                <Placeholder
                    name={PlaceholderNames.ProductUnavailablePopup}
                    onClose={redirectToViewBookingPage}
                    rendering={rendering}
                    areNoOptionsAvailable={areNoValidatedOptions}
                />
            )}
        </>
    );
};

export default observer(AmendRoomAndBoard);
