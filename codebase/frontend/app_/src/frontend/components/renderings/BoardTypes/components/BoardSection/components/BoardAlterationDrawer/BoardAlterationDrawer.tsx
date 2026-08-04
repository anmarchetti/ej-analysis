import { IBoardType } from 'models/data/IHotel';
import { IAltBoard, IUnit } from 'models/data/IOffer';
import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';
import BookingAlterationDrawer, {
    IAlterationResultItem,
    IAlterationResults,
} from 'frontend/components/common/BookingAlterationDrawer/BookingAlterationDrawer';
import BoardCard from 'frontend/components/renderings/BoardTypes/components/BoardCard/BoardCard';

export interface IBoardAlterationDrawerProps {
    alterationChangingFromTitle: ISitecoreField<string>;
    alterationResSubtitle: ISitecoreField<string>;
    alterationResTextPlural: ISitecoreField<string>;
    alterationResTextSingular: ISitecoreField<string>;
    alterationResTitle: ISitecoreField<string>;
    alterationSubtitle: ISitecoreField<string>;
    changedBoard: IAltBoard | IBoardType;
    freeChildPlaceInfoText: ISitecoreField<string>;
    freeChildPlaceInfoTitle: ISitecoreField<string>;
    handleCancelClick: () => void;
    handleConfirmClick: () => void;
    isAlterationModalShow: boolean;
    newAlternativeRooms: IAlterationResultItem<IUnit>[];
    priceChange: number;
    countryCode?: string;
    fallbackImage?: string;
    freeChildPlaceTooltip?: string;
}

export function BoardAlterationDrawer({
    alterationResTextPlural,
    alterationResTextSingular,
    alterationResTitle,
    alterationResSubtitle,
    changedBoard,
    fallbackImage,
    newAlternativeRooms,
    priceChange,
    alterationSubtitle,
    alterationChangingFromTitle,
    freeChildPlaceInfoTitle,
    freeChildPlaceInfoText,
    isAlterationModalShow,
    handleCancelClick,
    handleConfirmClick,
    countryCode,
    freeChildPlaceTooltip,
}: IBoardAlterationDrawerProps) {
    const isFreeChildPlaceInfoVisible = newAlternativeRooms?.some(e => e?.isKidsPlaceWilBeRemoved);
    const isMultiRoomAlteration = newAlternativeRooms?.length > 1;
    const alterationResultText = isMultiRoomAlteration ? alterationResTextPlural : alterationResTextSingular;
    const alterationResults: IAlterationResults[] = [
        {
            items: newAlternativeRooms,
            title: alterationResTitle,
            subtitle: alterationResSubtitle,
            text: alterationResultText,
        },
    ];

    return (
        <BookingAlterationDrawer
            selectedItemElement={
                <BoardCard
                    board={changedBoard}
                    isSpoiler={false}
                    isSelected
                    countryCode={countryCode}
                    freeChildPlaceTooltip={freeChildPlaceTooltip}
                />
            }
            hideInfoBlock={!isFreeChildPlaceInfoVisible}
            price={priceChange}
            subtitle={alterationSubtitle}
            alterationResults={alterationResults}
            alterationChangingFromTitle={alterationChangingFromTitle}
            freeChildPlaceInfoTitle={freeChildPlaceInfoTitle}
            freeChildPlaceInfoText={freeChildPlaceInfoText}
            isOpen={isAlterationModalShow}
            fallbackImage={fallbackImage}
            onCancel={handleCancelClick}
            onConfirm={handleConfirmClick}
        />
    );
}

export default BoardAlterationDrawer;
