import { useEffect, useState } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import { observer } from 'mobx-react';

import { scrollToErrorBlock } from 'frontend/utils/ui.utils';
import Button from 'frontend/components/common/Button';
import { ERROR_MESSAGE_CLASSNAME } from 'frontend/components/common/ErrorMessage';
import RichTextWithLinks from 'frontend/components/common/RichTextWithLinks';
import { useGroupBookingStore } from 'frontend/components/renderings/TradePortalGroupBooking/store/createStore';
import { ITradePortalGroupBookingFields } from 'frontend/components/renderings/TradePortalGroupBooking/TradePortalGroupBooking';

import GroupBookingAgentInformation from './GroupBookingAgentInformation/GroupBookingAgentInformation';
import GroupBookingCustomersInfo from './GroupBookingCustomersInfo/GroupBookingCustomersInfo';
import GroupBookingHolidayInformation from './GroupBookingHolidayInformation/GroupBookingHolidayInformation';

import style from './GroupBookingForm.module.scss';

interface IGroupBookingFormProps {
    fields: ITradePortalGroupBookingFields;
}

const GroupBookingForm = ({ fields }: IGroupBookingFormProps) => {
    const [shouldScrollToError, setShouldScrollToError] = useState<boolean>(false);
    const { formKey, groupBooking, submitForm, toggleForceErrors, forceErrors } = useGroupBookingStore();

    const { FormTitle, FormDescription, SubmitCTAText } = fields || {};

    useEffect(() => {
        if (forceErrors && shouldScrollToError) {
            scrollToErrorBlock();
            scrollToErrorMessageBlock();
            setShouldScrollToError(false);
        }
    }, [forceErrors, shouldScrollToError]);

    const onSubmitForm = async (event?: React.MouseEvent | React.FormEvent) => {
        event?.preventDefault();

        if (groupBooking.isValid) {
            submitForm();
        } else {
            toggleForceErrors(true);
            setShouldScrollToError(true);
        }
    };

    const scrollToErrorMessageBlock = () => {
        const section = document.getElementsByClassName(ERROR_MESSAGE_CLASSNAME)[0];
        section?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    return (
        <form key={formKey} onSubmit={onSubmitForm} className='mt-3 pb-5' data-tid='group-booking-form'>
            <div className='row'>
                <div className='col-12 col-lg-7'>
                    <Text
                        field={FormTitle}
                        className={style['form-title']}
                        tag='h2'
                        data-tid='group-booking-form-title'
                    />
                    <RichTextWithLinks field={FormDescription} dataId='group-booking-form-description' />
                </div>
            </div>
            <div className='row mt-4'>
                <div className='col-12 col-lg-4'>
                    <div className={style['info']} data-tid='group-booking-form-info'>
                        <GroupBookingAgentInformation fields={fields} />
                        <GroupBookingCustomersInfo fields={fields} />
                        <GroupBookingHolidayInformation fields={fields} />
                        <Button isFullWidth isMedium onClick={onSubmitForm} data-tid='group-booking-form-btn'>
                            <Text field={SubmitCTAText} tag='span' />
                        </Button>
                    </div>
                </div>
            </div>
        </form>
    );
};

export default observer(GroupBookingForm);
