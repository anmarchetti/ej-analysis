import { FC } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';

import { Tokens } from 'code/tokens';
import { Tokenizer } from 'frontend/utils/tokenizer';
import { IPopupFields } from 'models/data/BaseFields';
import Button from 'frontend/components/common/Button';
import FloatingPopup from 'frontend/components/common/FloatingPopup/FloatingPopup';
import JSSImageNext from 'frontend/components/common/JSSImageNext/JSSImageNext';
import RichTextWithLinks from 'frontend/components/common/RichTextWithLinks';

import styles from './Popup.module.scss';

export interface IPopupProps {
    onSecondaryBtnClick: () => void;
    customerFullName?: string;
    disableOutsideClick?: boolean;
    emailAddress?: string;
    fields?: IPopupFields;
    onPrimaryBtnClick?: () => void;
}

const Popup: FC<IPopupProps> = ({
    fields,
    onPrimaryBtnClick,
    onSecondaryBtnClick,
    disableOutsideClick = false,
    emailAddress,
    customerFullName,
}) => {
    if (!fields) {
        return null;
    }

    const {
        Title,
        Description,
        PrimaryButtonLabel,
        PrimaryButtonScreenReaderText,
        SecondaryButtonLabel,
        SecondaryButtonScreenReaderText,
        Icon,
    } = fields;

    const personalizedDescription = Tokenizer.replaceTokens(Description.value, {
        [Tokens.Email]: emailAddress || '',
        [Tokens.PassengerName]: customerFullName || '',
    });

    return (
        <FloatingPopup
            onClose={onSecondaryBtnClick}
            disableOutsideClick={disableOutsideClick}
            bodyClass={styles.bodyClass}
            footerClass={styles.footer}
            footerContent={
                <>
                    {SecondaryButtonLabel.value && (
                        <Button
                            onClick={onSecondaryBtnClick}
                            isOutlined
                            className={styles.btnSecondary}
                            aria-label={SecondaryButtonScreenReaderText.value}
                            data-tid='button-secondary'
                        >
                            {SecondaryButtonLabel.value}
                        </Button>
                    )}
                    {PrimaryButtonLabel.value && (
                        <Button
                            onClick={onPrimaryBtnClick}
                            className={styles.btnPrimary}
                            aria-label={PrimaryButtonScreenReaderText.value}
                            data-tid='button-primary'
                        >
                            {PrimaryButtonLabel.value}
                        </Button>
                    )}
                </>
            }
        >
            <div className={styles.header}>
                <JSSImageNext field={Icon} className={styles.icon} />
                <Text field={Title} className={styles.title} tag='h3' />
            </div>
            <RichTextWithLinks field={{ value: personalizedDescription }} className={styles.description} />
        </FloatingPopup>
    );
};

export default Popup;
