import React from 'react';

import useStore from 'frontend/hooks/useStore';
import { isHolidayStore } from 'frontend/store/holidays';
import { TStores } from 'frontend/store/IStores';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';
import ConfirmationInfo from 'frontend/components/common/ConfirmationInfo/ConfirmationInfo';

export interface IInfoBlockProps extends ISitecoreComponent<IInfoBlockFields> {
    isConfirmPolicyChecked: boolean;
    isConfirmPolicyValid: boolean;
    togglePolicy: () => void;
    children?: any;
    disabled?: boolean;
    hideInfoHead?: boolean;
}

export interface IInfoBlockFields {
    ImportantInformation: ISitecoreField<string>;
    ImportantInformationConfirmation: ISitecoreField<string>;
    ImportantInformationConfirmationWithAirportParking?: ISitecoreField<string>;
}

export const InfoBlock = (props: IInfoBlockProps): React.JSX.Element => {
    const { isExternalExtrasEnabled, selectedAirportParking } = useStore((stores: TStores) => ({
        isExternalExtrasEnabled: isHolidayStore(stores) ? stores.layoutStore.isExternalExtrasEnabled : undefined,
        selectedAirportParking: isHolidayStore(stores) ? stores.airportParkingStore.selectedAirportParking : undefined,
    }));

    const { ImportantInformationConfirmation, ImportantInformationConfirmationWithAirportParking } = props.fields || {};

    const checkboxLabel =
        isExternalExtrasEnabled && selectedAirportParking
            ? ImportantInformationConfirmationWithAirportParking
            : ImportantInformationConfirmation;

    return (
        <ConfirmationInfo
            importantInformation={props.fields?.ImportantInformation}
            checkboxLabel={checkboxLabel}
            onClick={props.togglePolicy}
            isConfirmPolicyChecked={props.isConfirmPolicyChecked}
            isConfirmPolicyValid={props.isConfirmPolicyValid}
            hideInfoHead={props.hideInfoHead}
            disabled={props.disabled}
        >
            {props.children}
        </ConfirmationInfo>
    );
};

export default InfoBlock;
