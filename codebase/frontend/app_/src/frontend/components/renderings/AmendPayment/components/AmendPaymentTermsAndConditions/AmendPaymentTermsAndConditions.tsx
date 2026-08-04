import React from 'react';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import ErrorMessage from 'frontend/components/common/ErrorMessage';
import RichTextDictionary from 'frontend/components/common/RichTextDictionary';
import IconInfoCircle from 'frontend/components/icons/InfoCircle';
import { IPaymentPageFields } from 'frontend/components/renderings/AmendPayment/interfaces';
import TermsAndConditions from 'frontend/components/renderings/Payment/components/TermsAndConditions';

interface IAmendPaymentTermsAndConditionsProps {
    fields: IPaymentPageFields | undefined;
}

function AmendPaymentTermsAndConditions({ fields }: IAmendPaymentTermsAndConditionsProps) {
    const { confirmPolicy, shouldConfirmPolicy, transferErrors, isTransfersHidden, togglePolicy, getPhrase } = useStore(
        (stores: IHolidaysStores) => ({
            confirmPolicy: stores.amendPaymentStore.confirmPolicy,
            shouldConfirmPolicy: stores.amendPaymentStore.shouldConfirmPolicy,
            transferErrors: stores.payStore.transferErrors,
            isTransfersHidden: stores.bookingStore.isTransfersHidden,
            togglePolicy: () => stores.amendPaymentStore.togglePolicy(!stores.amendPaymentStore.confirmPolicy),
            getPhrase: stores.layoutStore.getPhrase,
        }),
    );

    const isConfirmPolicyValid = shouldConfirmPolicy === false;

    return (
        <TermsAndConditions
            togglePolicy={togglePolicy}
            isConfirmPolicyChecked={confirmPolicy}
            isConfirmPolicyValid={isConfirmPolicyValid}
            confirmationLabel={fields?.ImportantInformationConfirmation}
            fields={fields}
            params={{}}
            rendering={undefined}
            largeCheckbox
        >
            {(!!transferErrors?.length || isTransfersHidden) && (
                <ErrorMessage
                    message={getPhrase(SitecoreDictionary.PaymentFailureMessagesNoTransferOption)}
                    description={
                        <RichTextDictionary
                            dictionaryKey={SitecoreDictionary.PaymentFailureMessagesNoTransferOptionDescriptionHTML}
                        />
                    }
                    icon={<IconInfoCircle />}
                    IsNotification
                />
            )}
        </TermsAndConditions>
    );
}

export default observer(AmendPaymentTermsAndConditions);
