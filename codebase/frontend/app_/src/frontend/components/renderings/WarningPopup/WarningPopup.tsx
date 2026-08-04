import { FC } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';

import { ISitecoreField, ISitecoreImage } from 'models/sitecore/generic/ISitecoreField';
import Button from 'frontend/components/common/Button';
import FloatingPopup from 'frontend/components/common/FloatingPopup/FloatingPopup';
import JSSImage from 'frontend/components/common/JSSImage';
import LuxuryWrapper from 'frontend/components/common/LuxuryWrapper/LuxuryWrapper';
import RichTextWithLinks from 'frontend/components/common/RichTextWithLinks';

import styles from './WarningPopup.module.scss';

export interface IWarningPopupProps {
    description: ISitecoreField<string>;
    onClose: () => void;
    title: ISitecoreField<string>;
    bodyClass?: string;
    contentClass?: string;
    ctaClass?: string;
    ctaText?: ISitecoreField<string>;
    extraContent?: React.ReactNode;
    footerClass?: string;
    icon?: ISitecoreField<ISitecoreImage>;
    id?: string;
    luxuryLabel?: ISitecoreField<string>;
    onDescriptionLinkClick?: (e: MouseEvent) => void;
    onSecondaryCtaClick?: () => void;
    secondaryCtaText?: ISitecoreField<string>;
}

const WarningPopup: FC<IWarningPopupProps> = ({
    title,
    luxuryLabel,
    description,
    icon,
    ctaText,
    secondaryCtaText,
    onSecondaryCtaClick,
    onClose,
    id = 'warning-popup',
    onDescriptionLinkClick,
    extraContent,
    bodyClass,
    contentClass,
    ctaClass,
    footerClass,
}) => {
    const hasFooterContent = !!ctaText || !!secondaryCtaText;

    const content = (
        <>
            <div className={styles.titleWrapper}>
                {!!icon && <JSSImage field={icon} dataTid={`${id}-icon`} />}

                {!!title && <Text field={title} tag='h2' className={styles.title} data-tid={`${id}-title`} />}
            </div>

            <RichTextWithLinks
                onLinkClick={onDescriptionLinkClick}
                field={description}
                tag='p'
                className={styles.subtext}
                dataId={`${id}-description`}
            />

            {extraContent}
        </>
    );

    return (
        <FloatingPopup
            onClose={onClose}
            contentClass={classNames(styles.content, contentClass)}
            bodyClass={classNames(styles.body, bodyClass)}
            id={id}
            footerClass={classNames(styles.footer, footerClass)}
            footerContent={
                hasFooterContent ? (
                    <>
                        {!!ctaText && (
                            <Button
                                onClick={onClose}
                                type='button'
                                dataTid={`${id}-primary-cta`}
                                className={classNames(styles.primaryButton, ctaClass)}
                            >
                                <Text field={ctaText} />
                            </Button>
                        )}

                        {!!secondaryCtaText && (
                            <Button
                                onClick={onSecondaryCtaClick}
                                type='button'
                                isOutlined
                                className={classNames(styles.secondaryButton, ctaClass)}
                                dataTid={`${id}-secondary-cta`}
                            >
                                <Text field={secondaryCtaText} />
                            </Button>
                        )}
                    </>
                ) : undefined
            }
        >
            {luxuryLabel?.value ? (
                <LuxuryWrapper
                    label={luxuryLabel.value}
                    wrapperClassName={styles.luxuryWrapper}
                    contentClassName={styles.luxuryContent}
                >
                    {content}
                </LuxuryWrapper>
            ) : (
                content
            )}
        </FloatingPopup>
    );
};

export default WarningPopup;
