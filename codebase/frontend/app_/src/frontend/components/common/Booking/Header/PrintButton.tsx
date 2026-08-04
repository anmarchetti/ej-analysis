import * as React from 'react';
import classNames from 'classnames';

import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import Button, { IButtonProps } from 'frontend/components/common/Button';
import SvgPrinterFilled from 'frontend/components/icons-new/PrinterFilled';

interface IPrintButtonProps extends IButtonProps {
    isLabelHidden?: boolean;
    onClick?: () => void;
}

export const PrintButton = ({ isLabelHidden, onClick, ...buttonProps }: IPrintButtonProps) => {
    const { getPhrase, isScreenMedium } = useStore((stores: TStores) => ({
        getPhrase: stores.layoutStore.getPhrase,
        isScreenMedium: stores.appStore.isScreenMedium,
    }));

    // To prevent blinking of chatbot message
    const updateChatBotAnimationStyle = () => {
        const chatBotAnimation = document
            .querySelector('df-messenger')
            ?.shadowRoot?.querySelector('df-messenger-chat')
            ?.shadowRoot?.querySelector('df-message-list')
            ?.shadowRoot?.querySelector('#messageList .bot-animation');

        chatBotAnimation?.setAttribute('style', 'opacity: 1');
    };

    const handleClick = () => {
        updateChatBotAnimationStyle();
        onClick?.();
        window.print();
    };

    if (!isScreenMedium) {
        return null;
    }

    return (
        <Button {...buttonProps} onClick={handleClick}>
            <SvgPrinterFilled />
            <span className={classNames('print-btn__label text-single-line', isLabelHidden && 'visually-hidden')}>
                {getPhrase(SitecoreDictionary.GlobalsButtonsPrint)}
            </span>
        </Button>
    );
};

export default PrintButton;
