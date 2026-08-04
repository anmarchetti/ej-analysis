import { FC, useState } from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import Button, { IButtonProps } from 'frontend/components/common/Button';
import PopupNew from 'frontend/components/common/Popup/PopupNew';

import styles from './AnimatedPopup.module.scss';

const ANIMATION_DURATION = 500;

export interface IAnimatedPopupProps {
    firstButton: IButtonProps;
    isShown: boolean;
    containerClass?: string;
    content?: JSX.Element;
    onClose?: () => void;
    secondButton?: IButtonProps;
    showCloseButton?: boolean;
}

const AnimatedPopup: FC<IAnimatedPopupProps> = ({
    content,
    firstButton,
    secondButton,
    showCloseButton,
    isShown,
    containerClass,
    onClose,
}) => {
    const [isClosing, setIsClosing] = useState(false);

    if (!isShown) return null;

    const onClick = (callback?: (event?: React.MouseEvent<HTMLButtonElement>) => void): void => {
        setIsClosing(true);

        setTimeout(() => {
            callback?.();
            setIsClosing(false);
        }, ANIMATION_DURATION);
    };

    return (
        <PopupNew
            containerClass={classNames(styles.container, containerClass)}
            dialogClass={classNames(styles.content, { [styles.exit]: isClosing })}
            footerContent={
                <>
                    <Button
                        className={firstButton.className}
                        onClick={(): void => onClick(firstButton.onClick)}
                        dataTid={firstButton.dataTid}
                    >
                        {firstButton.content}
                    </Button>

                    {secondButton && (
                        <Button
                            className={secondButton.className}
                            onClick={(): void => onClick(secondButton.onClick)}
                            dataTid={secondButton.dataTid}
                        >
                            {secondButton.content}
                        </Button>
                    )}
                </>
            }
            onClose={(): void => onClick(onClose)}
            showCloseButton={showCloseButton}
        >
            {content}
        </PopupNew>
    );
};

export default observer(AnimatedPopup);
