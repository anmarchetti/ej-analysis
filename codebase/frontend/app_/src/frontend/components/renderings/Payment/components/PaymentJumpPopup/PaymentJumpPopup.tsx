import { FC } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import AnimatedPopup from 'frontend/components/common/AnimatedPopup/AnimatedPopup';
import RichTextWithLinks from 'frontend/components/common/RichTextWithLinks';

import usePaymentJump, { IPaymentJumpProps } from './PaymentJumpPopup.utils';

import styles from './PaymentJumpPopup.module.scss';

const PaymentJumpPopup: FC<IPaymentJumpProps> = fields => {
    const { acceptButton, declineButton, title } = fields;
    const { descriptionContent, onApproveClick, onDeclineClick, isPaymentPriceJump } = usePaymentJump(fields);

    return (
        <AnimatedPopup
            isShown={isPaymentPriceJump}
            firstButton={{
                content: acceptButton?.value ?? '',
                dataTid: 'payment-jump-popup-accept-button',
                onClick: onApproveClick,
                className: styles.accept,
            }}
            secondButton={{
                content: declineButton?.value ?? '',
                dataTid: 'payment-jump-popup-decline-button',
                onClick: onDeclineClick,
                className: classNames('btn--reversed', styles.decline),
            }}
            content={
                <>
                    <Text tag='div' className={styles.title} field={title} data-tid='payment-jump-popup-title' />
                    <RichTextWithLinks
                        tag='div'
                        className={styles.description}
                        field={{ value: descriptionContent }}
                        dataId='payment-jump-popup-description'
                    />
                </>
            }
            containerClass={styles.paymentPopup}
        />
    );
};

export default observer(PaymentJumpPopup);
