import React, { FC } from 'react';

import Button from 'frontend/components/common/Button';
import { IPriceJumpPopupFields } from 'frontend/components/renderings/PriceJumpPopup/PriceJumpPopup';

export interface IPriceJumpPopupFooterProps {
    onClose: () => void;
    onDecline: () => void;
    fields?: Pick<IPriceJumpPopupFields, 'ContinueButtonLabel' | 'CloseButtonLabel' | 'DeclineButtonLabel'>;
    isOnlyCloseButton?: boolean;
    isOnlyContinueButton?: boolean;
}

const PriceJumpPopupFooter: FC<IPriceJumpPopupFooterProps> = ({
    onClose,
    onDecline,
    isOnlyCloseButton,
    isOnlyContinueButton,
    fields,
}) => {
    if (!fields) return null;

    const { ContinueButtonLabel, CloseButtonLabel, DeclineButtonLabel } = fields;

    if (isOnlyContinueButton || isOnlyCloseButton) {
        return (
            <Button onClick={onClose} dataTid='pricejump-popup-continue-cta'>
                {isOnlyContinueButton ? ContinueButtonLabel?.value : CloseButtonLabel?.value}
            </Button>
        );
    }

    return (
        <>
            <Button isOutlined dataTid='pricejump-popup-go-back-cta' onClick={onDecline}>
                {DeclineButtonLabel.value}
            </Button>
            <Button onClick={onClose} dataTid='pricejump-popup-continue-cta'>
                {ContinueButtonLabel.value}
            </Button>
        </>
    );
};

export default PriceJumpPopupFooter;
