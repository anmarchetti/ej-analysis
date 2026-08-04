import React, { FC } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-react';

import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';
import { JSSImage } from 'frontend/components/common/JSSImage';
import { IPriceJumpPopupFields } from 'frontend/components/renderings/PriceJumpPopup/PriceJumpPopup';

import styles from './PriceJumpPopupContent.module.scss';

export interface IPriceJumpPopupContentProps {
    description: string;
    refundDescription: string;
    fields?: Pick<IPriceJumpPopupFields, 'Icon' | 'QuestionLabel' | 'Title'>;
    isOnlyOneButton?: boolean;
    isRefund?: boolean;
    promoCodeSubtitle?: ISitecoreField<string>;
}

const PriceJumpPopupContent: FC<IPriceJumpPopupContentProps> = ({
    isRefund,
    refundDescription,
    description,
    promoCodeSubtitle,
    isOnlyOneButton,
    fields,
}) => {
    if (!fields) return null;

    const { Icon, Title, QuestionLabel } = fields;

    return (
        <div className={styles.content}>
            <div className={styles.head}>
                <JSSImage className={styles.icon} field={Icon} data-tid='price-jump-popup-icon' />
                <Text className={styles.title} tag='h3' field={Title} data-tid='title' />
            </div>
            <div className={styles.description} data-tid='price-jump-popup-description'>
                <div className={styles.mainText}>
                    <p>{description}</p>
                    {isRefund && <p data-tid='refund'>{refundDescription}</p>}
                </div>

                <Text tag='p' field={promoCodeSubtitle} data-tid='promo-subtitle' />

                {!isOnlyOneButton && <Text tag='p' field={QuestionLabel} className={styles.question} />}
            </div>
        </div>
    );
};

export default PriceJumpPopupContent;
