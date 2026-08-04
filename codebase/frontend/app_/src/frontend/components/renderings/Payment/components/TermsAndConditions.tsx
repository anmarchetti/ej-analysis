import React, { useEffect } from 'react';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import { TermsAndConditionsMessageTypes } from 'models/enum/TermsAndConditionsMessageTypes';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';
import ConfirmationInfo from 'frontend/components/common/ConfirmationInfo/ConfirmationInfo';

export interface ITermsAndConditionsProps extends ISitecoreComponent<ITermsAndConditionsFields> {
    isConfirmPolicyChecked: boolean;
    isConfirmPolicyValid: boolean;
    togglePolicy: () => void;
    children?: React.ReactNode;
    confirmationLabel?: ISitecoreField<string>;
    hideInfoHead?: boolean;
    largeCheckbox?: boolean;
}

export interface ITermsAndConditionsFields {
    ImportantInformation: ISitecoreField<string>;
    [TermsAndConditionsMessageTypes.PayRemainingBalanceTC]: ISitecoreField<string>;
    [TermsAndConditionsMessageTypes.CashRefundOnlyTC]: ISitecoreField<string>;
    [TermsAndConditionsMessageTypes.CreditRefundTC]: ISitecoreField<string>;
}

const TermsAndConditions = (props: ITermsAndConditionsProps) => {
    const { amendPassingConditionKey, togglePolicy, onForceErrors } = useStore((stores: IHolidaysStores) => ({
        amendPassingConditionKey: stores.amendPaymentStore.amendPassingConditionKey,
        togglePolicy: stores.amendPaymentStore.togglePolicy,
        onForceErrors: stores.amendPaymentStore.onForceErrors,
    }));

    useEffect(() => {
        togglePolicy(false);
        onForceErrors(false);
    }, [amendPassingConditionKey]);

    const checkboxLabel =
        props.confirmationLabel || (amendPassingConditionKey ? props.fields?.[amendPassingConditionKey] : '');

    return (
        <ConfirmationInfo
            importantInformation={props.fields?.ImportantInformation}
            checkboxLabel={checkboxLabel}
            onClick={props.togglePolicy}
            isConfirmPolicyChecked={props.isConfirmPolicyChecked}
            isConfirmPolicyValid={props.isConfirmPolicyValid}
            hideInfoHead={props.hideInfoHead}
            largeCheckbox={props.largeCheckbox}
        >
            {props.children}
        </ConfirmationInfo>
    );
};

export default observer(TermsAndConditions);
