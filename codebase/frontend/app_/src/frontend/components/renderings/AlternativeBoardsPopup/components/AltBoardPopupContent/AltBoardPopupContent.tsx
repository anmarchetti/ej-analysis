import { FC, useMemo } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { checkRoomsOnFreeForKids, getNewOfferUnitsByBoard } from 'frontend/utils/offer.utils';
import { sortBoardsByPrice } from 'frontend/utils/sort.utils';
import { IBoardType } from 'models/data/IHotel';
import { IAltBoard, IOffer, TAllBoards } from 'models/data/IOffer';
import { EventActions } from 'models/enum/tracking/GenericEventParams';
import InfoBlock from 'frontend/components/common/InfoBlock/InfoBlock';
import { IAltBoardsPopupFields } from 'frontend/components/renderings/AlternativeBoardsPopup/AlternativeBoardsPopup';
import styles from 'frontend/components/renderings/AlternativeBoardsPopup/AlternativeBoardsPopup.module.scss';
import AltBoardsPopupSkeleton from 'frontend/components/renderings/AlternativeBoardsPopup/components/AltBoardsPopupSkeleton/AltBoardsPopupSkeleton';
import AltBoardsSection from 'frontend/components/renderings/AlternativeBoardsPopup/components/AltBoardsSection/AltBoardsSection';
import OtherBoardsSplit from 'frontend/components/renderings/AlternativeBoardsPopup/components/OtherBoardsSplit/OtherBoardsSplit';

export interface IAltBoardPopupContentProps {
    allBoards: TAllBoards;
    confirmedBoard: IBoardType;
    fields: IAltBoardsPopupFields;
    offer: Nullable<IOffer>;
}

export const AltBoardPopupContent: FC<IAltBoardPopupContentProps> = ({ allBoards, fields, confirmedBoard, offer }) => {
    const {
        altBoards,
        altRooms,
        isLoadingOffersAlterations,
        notValidatedOfferPricePP,
        setActiveOfferId,
        trackSelectAltBoard,
        updateOffersWithSelectedBoard,
    } = useStore(stores => ({
        altBoards: stores.bookingStore.alternativeBoards,
        altRooms: stores.bookingStore.alternativeRooms,
        isLoadingOffersAlterations: stores.bookingStore.isLoadingOffersAlterations,
        notValidatedOfferPricePP: stores.bookingStore.notValidatedOfferPricePP,
        setActiveOfferId: stores.hotelsStore.setActiveOfferId,
        trackSelectAltBoard: stores.trackingStore.trackSelectAltBoard,
        updateOffersWithSelectedBoard: stores.hotelsStore.updateOffersWithSelectedBoard,
    }));
    const hasSelectedBoardFreeChild = useMemo(() => checkRoomsOnFreeForKids(offer?.accom.unit || []), [offer?.id]);
    const altBoardsSortedByPrice = sortBoardsByPrice(altBoards, notValidatedOfferPricePP) as IAltBoard[];

    if (isLoadingOffersAlterations) {
        return <AltBoardsPopupSkeleton />;
    }

    const onSelect = (board: IAltBoard): void => {
        if (!offer) {
            return;
        }

        const newOfferUnits = getNewOfferUnitsByBoard(offer.accom.unit, board, altRooms[0]);
        const newAltBoards = allBoards.filter(el => el.code !== board?.code) as IAltBoard[];

        updateOffersWithSelectedBoard(offer, board, newAltBoards, newOfferUnits);
        setActiveOfferId(null);
        trackSelectAltBoard(
            board.title,
            EventActions.Select,
            {
                destinationUrl: fields.MainTitle?.value,
                genericValue1: offer.hotel?.name,
                genericValue2: String(allBoards.length),
                genericValue3: null,
                genericValue4: null,
            },
            board.code,
        );
    };

    return (
        <>
            <header className={styles.header}>
                <Text tag='h2' field={fields.MainTitle} data-tid='alt-boards-dialog-title' />
            </header>
            <section className={styles.body}>
                <div className={styles.options} data-tid='main-board-item-block'>
                    <AltBoardsSection
                        items={[confirmedBoard]}
                        label={fields.CurrentChoiceTitle?.value}
                        selectedOffer={offer}
                        confirmedBoard={confirmedBoard}
                        isSelectedSection
                    />
                </div>
                {!!altBoardsSortedByPrice.length &&
                    (hasSelectedBoardFreeChild ? (
                        <OtherBoardsSplit
                            selectedOffer={offer}
                            altBoards={altBoardsSortedByPrice}
                            altRooms={altRooms}
                            confirmedBoard={confirmedBoard}
                            withFreeChildLabel={fields.WithFreeChildPlaceTitle?.value}
                            withoutFreeChildLabel={fields.WithoutFreeChildPlaceTitle?.value}
                            onSelect={onSelect}
                        />
                    ) : (
                        <div className={styles.options} data-tid='additional-board-items-block'>
                            <AltBoardsSection
                                items={altBoardsSortedByPrice}
                                label={fields.OtherOptionTitle?.value}
                                confirmedBoard={confirmedBoard}
                                selectedOffer={offer}
                                onSelect={onSelect}
                            />
                        </div>
                    ))}
            </section>
            <InfoBlock
                title={fields.RoomChangeInfoTitle}
                text={fields.RoomChangeInfoMessage}
                dataTid='room-change-info'
            />
        </>
    );
};

export default observer(AltBoardPopupContent);
