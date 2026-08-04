import * as React from 'react';
import { FunctionComponent } from 'react';

import { BoardTypeActionButtonType } from 'models/enum/BoardTypeActionButtonType';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import BlockSelected from 'frontend/components/common/BlockSelected';
import Button from 'frontend/components/common/Button';

import styles from './BoardTypeActionButton.module.scss';

export interface IBoardTypeActionButtonProps {
    buttonType: BoardTypeActionButtonType;
    children?: JSX.Element;
    isLoading?: boolean;
    onClick?: () => void;
}

const BoardTypeActionButton: FunctionComponent<IBoardTypeActionButtonProps> = ({
    buttonType,
    children,
    isLoading,
    onClick,
    ...rest
}) => {
    if (buttonType === BoardTypeActionButtonType.Selected) {
        return (
            <BlockSelected
                className={styles.boardSelected}
                siteCoreKey={SitecoreDictionary.BoardTypesButtonsSelected}
                dataTid='selected-board-type'
            />
        );
    }

    if (buttonType === BoardTypeActionButtonType.Price) {
        return (
            <Button
                className={styles.actionButton}
                isFullWidth
                disabled={isLoading}
                isLoading={isLoading}
                dataTid='board-type-action-button-price'
                onClick={(): void => onClick?.()}
                {...rest}
            >
                {children}
            </Button>
        );
    }

    if (buttonType === BoardTypeActionButtonType.PricePB) {
        return (
            <Button
                className={styles.actionButtonPB}
                isMedium
                isFullWidth
                isLoading={isLoading}
                dataTid='select-board-button'
                onClick={(): void => onClick?.()}
                {...rest}
            >
                {children}
            </Button>
        );
    }

    return null;
};

export default BoardTypeActionButton;
