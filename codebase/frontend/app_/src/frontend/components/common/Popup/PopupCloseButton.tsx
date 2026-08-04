import React from 'react';
import classNames from 'classnames';

import useStore from 'frontend/hooks/useStore';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import Button from 'frontend/components/common/Button';
import SvgCross from 'frontend/components/icons-new/Cross';

interface IPopupCloseButtonProps {
    className?: string;
    onClick?: (event?: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
}

export const PopupCloseButton = ({ onClick, className }: IPopupCloseButtonProps) => {
    const { getPhrase } = useStore(stores => ({
        getPhrase: stores.layoutStore.getPhrase,
    }));

    return (
        <Button
            isText
            className={classNames('popup__close', className)}
            onClick={onClick}
            aria-label={getPhrase(SitecoreDictionary.GlobalsButtonsClose)}
            dataTid='popup-close-button'
        >
            <SvgCross />
        </Button>
    );
};

export default PopupCloseButton;
