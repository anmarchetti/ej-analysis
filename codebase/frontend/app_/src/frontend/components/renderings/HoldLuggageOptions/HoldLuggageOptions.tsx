import { FC } from 'react';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { getIsSportEquipmentAvailableSeason } from 'frontend/utils/luggage.utils';
import { IHoldLuggageLists } from 'models/data/IHoldLuggage';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import HoldLuggageSection from 'frontend/components/renderings/HoldLuggageOptions/components/HoldLuggageSection/HoldLuggageSection';
import { IHoldLuggagePopupFields } from 'frontend/components/renderings/HoldLuggagePopup/HoldLuggagePopup';

export interface IHoldLuggageOptionsProps extends ISitecoreComponent<IHoldLuggageLists> {
    additionalFields: IHoldLuggagePopupFields;
}

export const HoldLuggageOptions: FC<IHoldLuggageOptionsProps> = ({ additionalFields, fields }) => {
    const { travelDate, isSportsEquipmentAvailable, isHoldLuggageAvailable } = useStore(
        ({ bookingStore }: TStores) => ({
            travelDate: bookingStore.travelDate,
            isSportsEquipmentAvailable: bookingStore.extraLuggage.isSportsEquipmentAvailable,
            isHoldLuggageAvailable: bookingStore.extraLuggage.isHoldLuggageAvailable,
        }),
    );

    if (!fields) {
        return null;
    }

    const { HoldLuggageItems, SportsEquipmentItems, SportsEquipmentSubtitle, SportEquipmentRestrictedSeasons } = fields;
    const {
        AdditionalLuggageTitle,
        PriceLabel,
        ShowMoreLuggage,
        HideAdditionalLuggage,
        SportsEquipmentTitle,
        ShowMoreEquipment,
        HideAdditionalEquipment,
    } = additionalFields;

    const { RestrictionSeasonsList } = SportEquipmentRestrictedSeasons?.fields || {};
    const canAddSport =
        isSportsEquipmentAvailable && getIsSportEquipmentAvailableSeason(RestrictionSeasonsList, travelDate);

    return (
        <>
            {isHoldLuggageAvailable && (
                <HoldLuggageSection
                    Title={AdditionalLuggageTitle}
                    LuggageItems={HoldLuggageItems}
                    PriceLabel={PriceLabel}
                    showMore={ShowMoreLuggage?.value}
                    hideLabel={HideAdditionalLuggage?.value}
                />
            )}

            {canAddSport && (
                <HoldLuggageSection
                    Title={SportsEquipmentTitle}
                    Subtitle={SportsEquipmentSubtitle}
                    LuggageItems={SportsEquipmentItems}
                    PriceLabel={PriceLabel}
                    showMore={ShowMoreEquipment?.value}
                    hideLabel={HideAdditionalEquipment?.value}
                    isSport
                />
            )}
        </>
    );
};

export default observer(HoldLuggageOptions);
