import { FC, useState } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';

import { TrailingZeroDisplay } from 'code/currency';
import { Tokens } from 'code/tokens';
import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import { Tokenizer } from 'frontend/utils/tokenizer';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import Button from 'frontend/components/common/Button';
import PopupNew from 'frontend/components/common/Popup/PopupNew';
import RichTextWithLinks from 'frontend/components/common/RichTextWithLinks';
import { IExplanationPopup } from 'frontend/components/renderings/CancelBooking/components/RefundOptions/RefundOptions';

import styles from './RefundOptionPopup.module.scss';

export interface IRefundOptionPopupProps {
    fields: IExplanationPopup;
}

export const RefundOptionPopup: FC<IRefundOptionPopupProps> = ({ fields }) => {
    const { IsLinkVisible, LinkText, TitlePopup, TextPopup } = fields;
    const [isPopupShown, setIsPopupShown] = useState(false);
    const { getPhrase, depositPerPassenger, isEditMode, currency, formatMoney } = useStore(
        ({ layoutStore, holidayCreditStore, marketStore }: IHolidaysStores) => ({
            getPhrase: layoutStore.getPhrase,
            depositPerPassenger: holidayCreditStore.depositPerPassenger,
            isEditMode: layoutStore.isEditMode,
            currency: holidayCreditStore.booking?.paymentInfo?.currency,
            formatMoney: marketStore.formatMoney,
        }),
    );

    if (!IsLinkVisible?.value) {
        return null;
    }

    const onClose = (): void => setIsPopupShown(false);
    let text = TextPopup;

    if (!isEditMode) {
        const price = formatMoney(depositPerPassenger, {
            currency,
            trailingZeroDisplay: TrailingZeroDisplay.StripIfInteger,
        });
        const pricePP = Tokenizer.replaceToken(
            getPhrase(SitecoreDictionary.GlobalsPriceLabelsPerPerson),
            Tokens.Price,
            price,
        );
        text = {
            value: Tokenizer.replaceToken(TextPopup.value, Tokens.DepositPricePP, pricePP),
        };
    }

    return (
        <div>
            <Button
                dataTid='refund-option-link'
                isText
                className={styles.link}
                onClick={(): void => setIsPopupShown(true)}
            >
                {LinkText?.value}
            </Button>
            {isPopupShown && (
                <PopupNew
                    dialogClass={styles.dialog}
                    onClose={onClose}
                    footerContent={
                        <Button
                            dataTid='refund-option-close-btn'
                            isOutlined
                            onClick={onClose}
                            className={styles.popupBtn}
                        >
                            {getPhrase(SitecoreDictionary.GlobalsButtonsClose)}
                        </Button>
                    }
                >
                    <Text field={TitlePopup} tag='h4' className={styles.title} />
                    <RichTextWithLinks field={text} className={styles.text} />
                </PopupNew>
            )}
        </div>
    );
};

export default RefundOptionPopup;
