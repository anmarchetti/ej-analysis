import { FC, useMemo } from 'react';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { TAllBoards } from 'models/data/IOffer';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { EventActions } from 'models/enum/tracking/GenericEventParams';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';
import Button from 'frontend/components/common/Button';
import Drawer from 'frontend/components/common/Drawer';
import { Popup } from 'frontend/components/common/Popup';

import AltBoardPopupContent from './components/AltBoardPopupContent/AltBoardPopupContent';

import styles from './AlternativeBoardsPopup.module.scss';

export interface IAltBoardsPopupFields {
    CurrentChoiceTitle: ISitecoreField<string>;
    MainTitle: ISitecoreField<string>;
    OtherOptionTitle: ISitecoreField<string>;
    RoomChangeInfoMessage: ISitecoreField<string>;
    RoomChangeInfoTitle: ISitecoreField<string>;
    WithFreeChildPlaceTitle: ISitecoreField<string>;
    WithoutFreeChildPlaceTitle: ISitecoreField<string>;
}

export type TAltBoardsPopupProps = ISitecoreComponent<IAltBoardsPopupFields>;

export const AlternativeBoardsPopup: FC<TAltBoardsPopupProps> = ({ fields }) => {
    const { activeOfferId, altBoards, isScreenMedium, offers, setActiveOfferId, trackSelectAltBoard, getPhrase } =
        useStore(stores => ({
            activeOfferId: stores.hotelsStore.activeOfferId,
            altBoards: stores.bookingStore.alternativeBoards,
            isScreenMedium: stores.appStore.isScreenMedium,
            offers: stores.hotelsStore.offers,
            setActiveOfferId: stores.hotelsStore.setActiveOfferId,
            getPhrase: stores.layoutStore.getPhrase,
            trackSelectAltBoard: stores.trackingStore.trackSelectAltBoard,
        }));
    const offer = useMemo(() => offers.find(el => !!activeOfferId && el.id === activeOfferId), [offers, activeOfferId]);
    const originalRoom = (offer?.accom?.unit || [])[0];

    // original board with prices + alternative boards
    const allBoards: TAllBoards = useMemo(() => {
        if (!originalRoom?.boardType) {
            return [];
        }

        const originalBoard = {
            ...originalRoom.boardType,
            // TO DO: investigate whether originalRoom.boardType.price / originalRoom.boardType.pricePP are ever populated here;
            // if not, these lines can be simplified
            price: originalRoom.boardType.price ?? offer?.price ?? 0,
            pricePP: originalRoom.boardType.pricePP ?? offer?.pricePP ?? 0,
            priceExcludingTouristTax: offer?.priceExcludingTouristTax ?? 0,
            pricePPExcludingTouristTax: offer?.pricePPExcludingTouristTax ?? 0,
            accommodationId: originalRoom.accommodationId,
            packageId: originalRoom.packageId,
        };

        return [originalBoard, ...altBoards];
    }, [offer?.id]);

    // selected and confirmed board, original board with prices by default
    const confirmedBoard = allBoards.find(el => el.code === originalRoom?.boardType.code) ?? originalRoom?.boardType;
    const isAltBoardsPopupOpened = !!activeOfferId;
    const isHiddenOnDesktop = isScreenMedium && (!offer || !isAltBoardsPopupOpened);

    if (!fields || !confirmedBoard || isHiddenOnDesktop) {
        return null;
    }

    const onClose = (): void => {
        setActiveOfferId(null);
        trackSelectAltBoard(confirmedBoard?.title, EventActions.Close, {
            destinationUrl: fields.MainTitle?.value,
            genericValue1: offer?.hotel?.name,
            genericValue2: String(allBoards.length),
            genericValue3: null,
            genericValue4: null,
        });
    };
    const popupBody = (
        <AltBoardPopupContent allBoards={allBoards} fields={fields} confirmedBoard={confirmedBoard} offer={offer} />
    );

    if (!isScreenMedium) {
        return (
            <Drawer open={isAltBoardsPopupOpened} className={styles.drawer} dataTid='alt-boards-drawer'>
                {popupBody}
                <div data-tid='drawer-actions' className='drawer__actions'>
                    <Button isMedium onClick={onClose} isTransparent>
                        {getPhrase(SitecoreDictionary.GlobalsButtonsClose)}
                    </Button>
                </div>
            </Drawer>
        );
    }

    return (
        <Popup onClose={onClose} containerClass={styles.popup} id='alt-boards-popup' showCloseButton>
            {popupBody}
        </Popup>
    );
};

export default observer(AlternativeBoardsPopup);
