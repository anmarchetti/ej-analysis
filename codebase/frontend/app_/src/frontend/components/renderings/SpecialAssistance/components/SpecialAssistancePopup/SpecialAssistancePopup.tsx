import { FC } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';

import { callChatBot } from 'frontend/utils/viewBooking.utils';
import { ISitecoreField, ISitecoreImage } from 'models/sitecore/generic/ISitecoreField';
import Button from 'frontend/components/common/Button';
import FloatingPopup from 'frontend/components/common/FloatingPopup/FloatingPopup';
import JSSImageNext from 'frontend/components/common/JSSImageNext/JSSImageNext';
import RichTextWithLinks from 'frontend/components/common/RichTextWithLinks';

import styles from './SpecialAssistancePopup.module.scss';

export interface ISpecialAssistancePopupFields {
    Description: ISitecoreField<string>;
    Icon: ISitecoreField<ISitecoreImage>;
    SecondaryButtonLabel: ISitecoreField<string>;
    SecondaryButtonScreenReaderText: ISitecoreField<string>;
    Title: ISitecoreField<string>;
}
export interface ISpecialAssistancePopupProps {
    onClose: () => void;
    fields?: ISpecialAssistancePopupFields;
}

export const SpecialAssistancePopup: FC<ISpecialAssistancePopupProps> = ({ fields, onClose }) => {
    if (!fields) {
        return null;
    }

    const { Title, Description, SecondaryButtonLabel, SecondaryButtonScreenReaderText, Icon } = fields;

    const onRichTextLinkClick = (e: MouseEvent): void => {
        if ((e.target as HTMLElement).id === 'live-chat-btn') {
            callChatBot(e);
            onClose();
        }
    };

    return (
        <FloatingPopup
            onClose={onClose}
            bodyClass={styles.bodyClass}
            footerClass={styles.footer}
            footerContent={
                <>
                    {SecondaryButtonLabel.value && (
                        <Button
                            onClick={onClose}
                            isOutlined
                            dataTid='popup-close-btn'
                            className={styles.btnSecondary}
                            aria-label={SecondaryButtonScreenReaderText.value}
                        >
                            {SecondaryButtonLabel.value}
                        </Button>
                    )}
                </>
            }
            id='special-assistance-popup'
        >
            <div className={styles.header}>
                <JSSImageNext field={Icon} data-tid='popup-icon' className={styles.icon} />
                <Text field={Title} className={styles.title} tag='h3' data-tid='popup-title' />
            </div>
            <RichTextWithLinks
                field={Description}
                className={styles.description}
                dataId='popup-description'
                onLinkClick={onRichTextLinkClick}
                enableClickEventForEmptyLinks
            />
        </FloatingPopup>
    );
};

export default SpecialAssistancePopup;
