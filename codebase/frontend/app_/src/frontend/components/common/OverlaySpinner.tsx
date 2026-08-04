import React, { memo, useEffect } from 'react';

import { setBodyOverflow } from 'frontend/utils/ui.utils';
import IconLock from 'frontend/components/icons/Lock';

export interface IPaymentSpinnerProps {
    description?: string;
    header?: string;
    icon?: JSX.Element;
}

const OverlaySpinner = ({ header, description, icon = <IconLock /> }: IPaymentSpinnerProps) => {
    useEffect(() => {
        setBodyOverflow('hidden');

        return () => {
            setBodyOverflow('');
        };
    }, []);

    return (
        <div className='overlay-spinner'>
            <div className='overlay-spinner__container'>
                <div className='overlay-spinner__icon-container'>
                    <div className='overlay-spinner__icon' />

                    {icon}
                </div>

                {header && <div className='overlay-spinner__header'>{header}</div>}

                {description && <div className='overlay-spinner__description'>{description}</div>}
            </div>
        </div>
    );
};

export default memo(OverlaySpinner);
