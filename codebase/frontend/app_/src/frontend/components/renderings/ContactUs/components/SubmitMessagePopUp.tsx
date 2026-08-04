import { FC } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';

import { Tokens } from 'code/tokens';
import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import { Tokenizer } from 'frontend/utils/tokenizer';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';
import Button from 'frontend/components/common/Button';
import { Popup } from 'frontend/components/common/Popup';
import RichTextWithLinks from 'frontend/components/common/RichTextWithLinks';
import styles from 'frontend/components/renderings/ContactUs/ContactForm.module.scss';
import { useContactUsStore } from 'frontend/components/renderings/ContactUs/store/createStore';

export interface ISumbitMessagePopupProps {
    closeSubmitMessage: () => void;
    isSuccess: boolean;
    submitPopupContent: {
        FailedText: ISitecoreField<string>;
        FailedTitle: ISitecoreField<string>;
        SuccessText: ISitecoreField<string>;
        SuccessTextWithCaseNumber: ISitecoreField<string>;
        SuccessTitle: ISitecoreField<string>;
        SuccessTitleWithCaseNumber: ISitecoreField<string>;
    };
}

const SubmitMessagePopUp: FC<ISumbitMessagePopupProps> = ({ closeSubmitMessage, isSuccess, submitPopupContent }) => {
    const { getPhrase } = useStore((stores: IHolidaysStores) => ({
        getPhrase: stores.layoutStore.getPhrase,
    }));

    const { caseNumber } = useContactUsStore();

    const {
        SuccessTitleWithCaseNumber,
        SuccessTextWithCaseNumber,
        SuccessTitle,
        SuccessText,
        FailedTitle,
        FailedText,
    } = submitPopupContent;

    //if the message is for Kana (we don't have a caseNumber) then we show the old popup. If there is a caseNumber then show a new popup with a caseNumber
    const Title = caseNumber ? SuccessTitleWithCaseNumber : SuccessTitle;
    const Description = caseNumber ? SuccessTextWithCaseNumber : SuccessText;
    const button = caseNumber ? SitecoreDictionary.GlobalsButtonsClose : SitecoreDictionary.GlobalsButtonsOK;

    const popupTitle = isSuccess ? Title : FailedTitle;
    const popupBody = isSuccess ? Description : FailedText;
    const popupButtonText = isSuccess ? button : SitecoreDictionary.GlobalsButtonsTryAgain;

    const renderCloseButton = (): JSX.Element => (
        <Button onClick={closeSubmitMessage}>{getPhrase(popupButtonText)}</Button>
    );

    const DescriptionCaseNumber = caseNumber
        ? Tokenizer.replaceTokens(popupBody.value, {
              [Tokens.CaseNumber]: `<strong>(${caseNumber})</strong>` || '',
          })
        : popupBody.value;

    return (
        <Popup id='contact-submit-popup' containerClass={styles.submitPopup} footerContent={renderCloseButton()}>
            {popupTitle && <Text field={popupTitle} className={styles.submitFormTitle} tag='h5' />}
            <RichTextWithLinks
                data-tid='booking-reference'
                field={{
                    value: DescriptionCaseNumber,
                }}
            />
        </Popup>
    );
};

export default SubmitMessagePopUp;
