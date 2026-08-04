import React, { FC } from 'react';
import { observer } from 'mobx-react';

import { Tokens } from 'code/tokens';
import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import { Tokenizer } from 'frontend/utils/tokenizer';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import PaymentBaseOption from 'frontend/components/common/PriceOptions/PaymentBaseOption/PaymentBaseOption';
import RichTextWithLinks from 'frontend/components/common/RichTextWithLinks';
import { IPaymentPageFields } from 'frontend/components/renderings/AmendPayment/interfaces';

interface IPaymentOptionsFullProps {
    isSelected: boolean;
    fields?: IPaymentPageFields;
    onChange?: () => void;
}

const PaymentOptionsFull: FC<IPaymentOptionsFullProps> = ({ onChange, isSelected, fields }) => {
    const { totalPrice, getPhrase, currency, formatMoney, isPayingFeesOnly } = useStore((stores: IHolidaysStores) => ({
        getPhrase: stores.layoutStore.getPhrase,
        totalPrice: stores.amendPaymentStore.totalPrice,
        getAmendTransportLabel: stores.amendPaymentStore.getAmendTransportLabel,
        currency: stores.amendPaymentStore.currency,
        isPayingFeesOnly: stores.amendPaymentStore.isPayingFeesOnly,
        formatMoney: stores.marketStore.formatMoney,
    }));

    const description = isPayingFeesOnly
        ? fields?.PayFeeAmendDescription?.value
        : fields?.PayFullAmendDescription?.value;

    const title = fields?.PayFullAmendTitle?.value;
    const amount = formatMoney(totalPrice ?? 0, {
        currency,
    });
    const payFullDescription = Tokenizer.replaceToken(
        description,
        Tokens.Amount,
        `<strong data-cs-mask="true">${amount}</strong>`,
    );

    return (
        <PaymentBaseOption
            checkboxId={'pay-full-option'}
            title={title || ''}
            isSelected={isSelected}
            onChange={onChange}
            price={totalPrice || 0}
            priceDescription={getPhrase(SitecoreDictionary.CreditConfirmRefundCardsTotal)}
            currency={currency}
        >
            <RichTextWithLinks field={{ value: payFullDescription }} className='credit-description' />
        </PaymentBaseOption>
    );
};

export default observer(PaymentOptionsFull);
