import React, { useEffect } from 'react';
import { Guid } from 'guid-typescript';
import { observer } from 'mobx-react';

import { IAnchorParameters } from 'models/data/IAnchorParameters';
import {
    IBoardAndRoomAlterationDrawerFields,
    IBoardAndRoomAlterationInfoFields,
    IBoardAndRoomAlterationKidsInfoFields,
} from 'models/data/IBoardAndRoomAlteration';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';

import BoardTypesWrapper from './components/BoardTypesWrapper/BoardTypesWrapper';
import useBoardStore from './components/hooks/useBoardStore';

export interface IBoardTypesFields
    extends IBoardAndRoomAlterationDrawerFields,
        IBoardAndRoomAlterationInfoFields,
        IBoardAndRoomAlterationKidsInfoFields {
    Title: ISitecoreField<string>;
    AlternativeBoardsTitlePlural?: ISitecoreField<string>;
    AlternativeBoardsTitleSingular?: ISitecoreField<string>;
    DrawerCancel?: ISitecoreField<string>;
    DrawerDescription?: ISitecoreField<string>;
    DrawerTitle?: ISitecoreField<string>;
    EditLabel?: ISitecoreField<string>;
    HideLabel?: ISitecoreField<string>;
    ShowLabel?: ISitecoreField<string>;
}

interface IBoardTypesParams extends IAnchorParameters {
    FallbackImage: string;
    IsExpanded: boolean;
    isPostBooking: boolean;
}

export interface IBoardTypesProps extends ISitecoreComponent<IBoardTypesFields, IBoardTypesParams> {
    countryCode?: string;
    freeChildPlaceTooltip?: string;
}

const BoardTypes: React.FC<IBoardTypesProps> = ({ params, fields, freeChildPlaceTooltip, countryCode, rendering }) => {
    const isPostBooking = params?.isPostBooking ?? false;

    const { offer, failedToLoadData, selectedBoardType, allBoardTypes, changeBoardCodeError } =
        useBoardStore(isPostBooking);

    useEffect(() => {
        changeBoardCodeError?.();
    }, []);

    if (failedToLoadData || !offer || !fields || !allBoardTypes?.length) {
        return null;
    }

    return (
        <BoardTypesWrapper
            anchor={params?.Anchor ?? Guid.create().toString()}
            fields={fields}
            offer={offer}
            allBoardTypes={allBoardTypes}
            selectedBoardType={selectedBoardType}
            fallbackImage={params?.FallbackImage}
            isPostBooking={isPostBooking}
            freeChildPlaceTooltip={freeChildPlaceTooltip}
            countryCode={countryCode}
            rendering={rendering}
        />
    );
};

export default observer(BoardTypes);
