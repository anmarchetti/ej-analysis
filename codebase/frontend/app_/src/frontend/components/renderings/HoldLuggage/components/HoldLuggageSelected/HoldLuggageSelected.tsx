import { FC } from 'react';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import ComplementaryBags from 'frontend/components/renderings/HoldLuggage/components/ComplementaryBags/ComplementaryBags';
import HoldLuggageRow from 'frontend/components/renderings/HoldLuggage/components/HoldLuggageRow/HoldLuggageRow';
import useLuggageItems from 'frontend/components/renderings/HoldLuggage/hooks/useLuggageItems';
import { IHoldLuggageFields } from 'frontend/components/renderings/HoldLuggage/IHoldLuggageFields';

export interface IHoldLuggageSelectedProps {
    additionalFields: IHoldLuggageFields;
    infantsNumber: number;
}

export const HoldLuggageSelected: FC<IHoldLuggageSelectedProps> = ({ additionalFields, infantsNumber }) => {
    const { selectedSportEquipmentPrice, setHoldLuggagePopupOpened } = useStore((stores: TStores) => ({
        selectedSportEquipmentPrice: stores.bookingStore.holdLuggage.selectedSportEquipmentPrice,
        setHoldLuggagePopupOpened: stores.bookingStore.holdLuggage.setHoldLuggagePopupOpened,
    }));

    const onEditClick = (): void => {
        setHoldLuggagePopupOpened(true);
    };

    const selectedLuggageItems = useLuggageItems({
        additionalFields,
        selectedSportEquipmentPrice,
    });

    return (
        <div>
            <ComplementaryBags infantsNumber={infantsNumber} additionalFields={additionalFields} />
            {selectedLuggageItems.map((item, idx) => (
                <HoldLuggageRow key={idx} {...item} onEditClick={onEditClick} />
            ))}
        </div>
    );
};

export default observer(HoldLuggageSelected);
