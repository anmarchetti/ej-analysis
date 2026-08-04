import React from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';
import IconInfoCircle from 'frontend/components/icons/InfoCircle';

import ConfirmationCheckbox from './ConfirmationCheckbox';
import ConfirmationInfoText from './ConfirmationInfoText';

export interface IConfirmationInfoProps {
    isConfirmPolicyChecked: boolean;
    isConfirmPolicyValid: boolean;
    onClick: () => void;
    checkboxLabel?: ISitecoreField<string> | string;
    children?: any;
    containerClassName?: string;
    disabled?: boolean;
    hideInfoHead?: boolean;
    importantInformation?: ISitecoreField<string>;
    largeCheckbox?: boolean;
}

export const ConfirmationInfo: React.FC<IConfirmationInfoProps> = props => {
    const { getPhrase } = useStore((stores: TStores) => ({
        getPhrase: stores.layoutStore.getPhrase,
    }));

    const hasError = props.isConfirmPolicyValid === false;

    return (
        <div
            id='terms-and-conditions'
            className={classNames('info', props.containerClassName)}
            data-tid='information-section'
        >
            {!props.hideInfoHead && (
                <div className='info-head'>
                    <IconInfoCircle />
                    {getPhrase(SitecoreDictionary.GlobalsLabelsImportantInformation)}
                </div>
            )}
            {!!props.importantInformation?.value && <ConfirmationInfoText text={props.importantInformation.value} />}
            {props.children}
            <ConfirmationCheckbox
                checked={props.isConfirmPolicyChecked}
                disabled={props.disabled}
                label={props.checkboxLabel}
                onChange={props.onClick}
                hasError={hasError}
                errorMessage={getPhrase(SitecoreDictionary.GuestDetailsErrorMessagesConfirmCheckboxDoesNotCheck)}
                large={props.largeCheckbox}
            />
        </div>
    );
};

export default observer(ConfirmationInfo);
