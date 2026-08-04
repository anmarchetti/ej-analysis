import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import { observer } from 'mobx-react';

import ValidatableField from 'frontend/components/common/ValidatableField/ValidatableField';
import styles from 'frontend/components/renderings/TradePortalGroupBooking/components/GroupBookingForm/GroupBookingForm.module.scss';
import { GroupBookingFormFields } from 'frontend/components/renderings/TradePortalGroupBooking/data/GroupBooking';
import { useGroupBookingStore } from 'frontend/components/renderings/TradePortalGroupBooking/store/createStore';
import { ITradePortalGroupBookingFields } from 'frontend/components/renderings/TradePortalGroupBooking/TradePortalGroupBooking';

interface IGroupBookingAgentInformationProps {
    fields?: ITradePortalGroupBookingFields;
}

const GroupBookingAgentInformation = ({ fields }: IGroupBookingAgentInformationProps) => {
    const { groupBooking, forceErrors } = useGroupBookingStore();

    if (!groupBooking || !fields) {
        return null;
    }

    const { AgentInfoTitle, AgentNamePlaceholder, AgentEmailPlaceholder, AgentNumberPlaceholder } = fields;

    return (
        <div data-tid='group-booking-agent-info'>
            <Text field={AgentInfoTitle} className={styles['form-section-title']} tag='p' />
            <ValidatableField
                onChange={value => groupBooking.onChangeField(GroupBookingFormFields.AgentName, value)}
                value={groupBooking.agentName}
                label={AgentNamePlaceholder?.value ?? ''}
                errors={groupBooking.validateField(GroupBookingFormFields.AgentName)}
                forceError={forceErrors}
                id={GroupBookingFormFields.AgentName}
                autoComplete={false}
                shouldTrimOnBlur
                required={groupBooking.isFieldRequired(GroupBookingFormFields.AgentName)}
                isVertical
            />
            <ValidatableField
                onChange={value => groupBooking.onChangeField(GroupBookingFormFields.AgentEmail, value)}
                value={groupBooking.agentEmail}
                label={AgentEmailPlaceholder?.value ?? ''}
                errors={groupBooking.validateField(GroupBookingFormFields.AgentEmail)}
                forceError={forceErrors}
                id={GroupBookingFormFields.AgentEmail}
                autoComplete={false}
                shouldTrimOnBlur
                required={groupBooking.isFieldRequired(GroupBookingFormFields.AgentEmail)}
                isVertical
            />
            <ValidatableField
                onChange={value => groupBooking.onChangeField(GroupBookingFormFields.AgentNumber, value)}
                value={groupBooking.agentNumber}
                label={AgentNumberPlaceholder?.value ?? ''}
                errors={groupBooking.validateField(GroupBookingFormFields.AgentNumber)}
                forceError={forceErrors}
                id={GroupBookingFormFields.AgentNumber}
                autoComplete={false}
                shouldTrimOnBlur
                required={groupBooking.isFieldRequired(GroupBookingFormFields.AgentNumber)}
                isVertical
            />
        </div>
    );
};

export default observer(GroupBookingAgentInformation);
