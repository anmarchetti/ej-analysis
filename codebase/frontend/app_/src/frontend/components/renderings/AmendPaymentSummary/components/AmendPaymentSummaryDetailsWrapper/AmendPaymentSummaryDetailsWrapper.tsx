import { FunctionComponent } from 'react';
import { Placeholder } from '@sitecore-jss/sitecore-jss-nextjs';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { AmendmentType } from 'models/data/IBookingInfo';
import { PlaceholderNames } from 'models/enum/PlaceholderNames';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import { getMetaByAmendmentType } from 'frontend/components/renderings/AmendPayment/AmendPayment.utils';
import AmendPaymentItemContainer from 'frontend/components/renderings/AmendPayment/components/AmendPaymentAccordion/components/AmendPaymentItemContainer/AmendPaymentItemContainer';
import { IPaymentPageFields } from 'frontend/components/renderings/AmendPayment/interfaces';

import styles from './AmendPaymentSummaryDetailsWrapper.module.scss';

export interface IAmendPaymentSummaryDetailsWrapperProps {
    fields: IPaymentPageFields;
    rendering: ISitecoreComponent['rendering'];
}

const AmendPaymentSummaryDetailsWrapper: FunctionComponent<IAmendPaymentSummaryDetailsWrapperProps> = ({
    fields,
    rendering,
}) => {
    const { booking, isFromAmendSeats } = useStore(stores => ({
        booking: stores.amendPaymentStore.booking,
        isFromAmendSeats: stores.amendPaymentStore.isFromAmendSeats,
    }));

    if (!booking) {
        return null;
    }

    const headerMeta = getMetaByAmendmentType(fields, AmendmentType.Seats);

    return (
        <AmendPaymentItemContainer className={styles.container} hideCta {...headerMeta}>
            {isFromAmendSeats && (
                <Placeholder name={PlaceholderNames.SeatsAndBags} rendering={rendering} booking={booking} />
            )}
        </AmendPaymentItemContainer>
    );
};

export default observer(AmendPaymentSummaryDetailsWrapper);
