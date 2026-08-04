import React from 'react';
import { inject, observer } from 'mobx-react';

import { Tokens } from 'code/tokens';
import { IPaymentFailureItem } from 'frontend/store/holidays/payment/payment-failures.config';
import { TStores } from 'frontend/store/IStores';
import { Tokenizer } from 'frontend/utils/tokenizer';
import { ApiErrors } from 'models/enum/ApiErrors';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { IComponentWithDictionary } from 'models/sitecore/generic/IComponentWithDictionary';
import Button from 'frontend/components/common/Button';
import ErrorMessage from 'frontend/components/common/ErrorMessage';
import RichTextDictionary from 'frontend/components/common/RichTextDictionary';
import RichTextWithLinks from 'frontend/components/common/RichTextWithLinks';
import SvgWarningFilled from 'frontend/components/icons-new/WarningFilled';
import { IPayBalancePageFields, IPaymentPageFields } from 'frontend/components/renderings/Payment/interfaces';

interface IPaymentErrorsProps extends IComponentWithDictionary {
    failedToPay: boolean;
    fields: IPaymentPageFields | IPayBalancePageFields | undefined;
    isAtcomError: boolean;
    paymentErrors: IPaymentFailureItem[];
    redirectToHomePage: () => void;
}

const PaymentErrors = (props: IPaymentErrorsProps) => {
    const { getPhrase } = props;

    if (!(props.paymentErrors && props.failedToPay && !!props.paymentErrors.length)) {
        return null;
    }

    return (
        <div className='row payment__failure'>
            <div className='col-12'>
                <div className='row'>
                    <div className='col-md-6 col-lg-4'>
                        {props.paymentErrors.map((el, idx) => (
                            <div key={idx}>
                                <ErrorMessage
                                    icon={<SvgWarningFilled />}
                                    description={
                                        el.code === ApiErrors.DenyPayment
                                            ? props.fields?.PaymentDeny && (
                                                  <RichTextWithLinks field={props.fields.PaymentDeny} tag='span' />
                                              )
                                            : el.descriptionKey && (
                                                  <RichTextDictionary dictionaryKey={el.descriptionKey} />
                                              )
                                    }
                                    message={el.messageKey && getPhrase(el.messageKey)}
                                    correlationId={
                                        el.correlationId &&
                                        Tokenizer.replaceToken(
                                            getPhrase(SitecoreDictionary.PaymentFailureMessagesCorrelationId),
                                            Tokens.Id,
                                            el.correlationId,
                                        )
                                    }
                                />
                            </div>
                        ))}

                        {props.isAtcomError && (
                            <Button isFullWidth isLink onClick={props.redirectToHomePage} dataTid='back-to-home-page'>
                                {props.getPhrase(SitecoreDictionary.PaymentButtonsGoToTheHomePage)}
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default inject((stores: TStores) => ({
    paymentErrors: stores.payStore.commitBookingErrors,
    failedToPay: stores.payStore.failedToPay,
    isAtcomError: stores.payStore.isAtcomError,
    redirectToHomePage: stores.routerStore.redirectToHomePage,
    getPhrase: stores.layoutStore.getPhrase,
}))(observer(PaymentErrors));
