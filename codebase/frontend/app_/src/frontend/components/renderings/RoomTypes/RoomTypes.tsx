import React, { useEffect, useState } from 'react';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import {
    IBoardAndRoomAlterationDrawerFields,
    IBoardAndRoomAlterationInfoFields,
    IBoardAndRoomAlterationKidsInfoFields,
} from 'models/data/IBoardAndRoomAlteration';
import { IRoomType } from 'models/data/IHotel';
import { IUnit } from 'models/data/IOffer';
import { IOriginalRoom } from 'models/data/IOriginalRoom';
import { NextRoomDisplayOption } from 'models/enum/NextRoomDisplayOption';
import SiteSettings from 'models/enum/SiteSettings';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';

import RoomTypesWrapper from './components/RoomTypesWrapper/RoomTypesWrapper';
import RoomUnavailablePopup from './components/RoomUnavailablePopup/RoomUnavailablePopup';

export interface IRoomTypesFields
    extends Partial<IBoardAndRoomAlterationDrawerFields>,
        Partial<IBoardAndRoomAlterationInfoFields>,
        Partial<IBoardAndRoomAlterationKidsInfoFields> {
    Title: ISitecoreField<string>;
    AlternativeRoomsLabelPlural?: ISitecoreField<string>;
    AlternativeRoomsLabelSingular?: ISitecoreField<string>;
    Description?: ISitecoreField<string>;
    DescriptionMobile?: ISitecoreField<string>;
    RoomInformation?: ISitecoreField<string>;
    RoomUnderSelected?: ISitecoreField<NextRoomDisplayOption>;
    TitleMobile?: ISitecoreField<string>;
    TitleMultiple?: ISitecoreField<string>;
    TitleNextToSelectedRoomPlural?: ISitecoreField<string>;
    TitleNextToSelectedRoomSingular?: ISitecoreField<string>;
}

export interface IRoomTypesParams {
    Anchor: string;
    Caching: string;
    CollapseRoomTypes: string;
}

function RoomTypes({ fields }: ISitecoreComponent<IRoomTypesFields, IRoomTypesParams>) {
    const {
        offer,
        alternativeRooms,
        failedLoadingOffersAlterations,
        isLoadingOffer,
        isRoomUnavailablePopupShown,
        onChangeRoom,
        getSetting,
    } = useStore((stores: TStores) => ({
        offer: stores.bookingStore.selectedOffer,
        alternativeRooms: stores.bookingStore.alternativeRooms,
        failedLoadingOffersAlterations: stores.bookingStore.failedLoadingOffersAlterations,
        isLoadingOffer: stores.bookingStore.isLoadingOffer,
        isRoomUnavailablePopupShown: stores.bookingStore.isRoomUnavailablePopupShown,
        onChangeRoom: stores.bookingStore.changeRoom,
        getSetting: stores.layoutStore.getSetting,
    }));

    const [originalRooms, setOriginalRooms] = useState<IOriginalRoom[]>([]);
    const [altRooms, setAltRooms] = useState<IUnit[][]>([]);

    const fallbackImage = getSetting(SiteSettings.HotelFallbackImage);

    /**
     * Returns modified roomType
     * to work in EE correctly
     * @param roomType
     */
    const withSitecoreValue = (roomType: IRoomType): IRoomType => {
        const room = { ...roomType };

        if (typeof roomType?.title === 'string') {
            // Check if values came from api not from sitecore
            room.title = {
                value: roomType?.title,
            };
        }

        return room;
    };

    const updateOriginalRooms = () => {
        const updatedRooms: IOriginalRoom[] =
            offer?.accom?.unit.map((room, index) => {
                const altRoomsForCurrentUnit = (alternativeRooms?.length && alternativeRooms[index]) || [];

                return {
                    index,
                    room: { ...room, roomType: withSitecoreValue(room.roomType) },
                    alternativeRooms: altRoomsForCurrentUnit.reduce((acc: IUnit[], altRoom) => {
                        if (altRoom.code !== room.code) {
                            acc.push({ ...altRoom, roomType: withSitecoreValue(altRoom.roomType) });
                        }

                        return acc;
                    }, []),
                    allRoomsCodes: altRoomsForCurrentUnit.map(r => r.code),
                };
            }) || [];

        setOriginalRooms(updatedRooms);
    };

    const updateAlternativeRooms = () => {
        if (!alternativeRooms?.length) {
            return;
        }

        const altRooms = alternativeRooms.map((items, altIndex) =>
            items.map((subitem, unitIndex) => ({
                ...subitem,
                roomType: withSitecoreValue(subitem.roomType),
                originalCode: originalRooms?.[altIndex]?.allRoomsCodes?.[unitIndex] ?? subitem.code,
            })),
        );

        setAltRooms(altRooms);
    };

    useEffect(() => {
        updateOriginalRooms();
        updateAlternativeRooms();
    }, []);

    useEffect(() => {
        updateOriginalRooms();
    }, [offer]);

    useEffect(() => {
        updateAlternativeRooms();
    }, [alternativeRooms]);

    if (!offer || !fields) {
        return null;
    }

    return (
        <>
            <RoomTypesWrapper
                offer={offer}
                originalRooms={originalRooms}
                alternativeRooms={altRooms}
                units={offer.accom.unit}
                isLoadingOffer={isLoadingOffer}
                failedLoadingOffersAlterations={failedLoadingOffersAlterations}
                fallbackImage={fallbackImage}
                fields={fields}
                onChangeRoom={onChangeRoom}
            />
            {isRoomUnavailablePopupShown && <RoomUnavailablePopup />}
        </>
    );
}

export default observer(RoomTypes);
