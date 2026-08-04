import React, { useMemo } from 'react';
import classNames from 'classnames';

import SvgCross from 'frontend/components/icons-new/Cross';
import SvgTick from 'frontend/components/icons-new/Tick';

interface IValidationIndicatorProps {
    label: string;
    valid: Nullable<boolean>;
}

const ValidationIndicator = ({ label, valid }: IValidationIndicatorProps) => {
    const { icon, className } = useMemo(() => {
        if (valid === true) {
            return { icon: <SvgTick />, className: 'validation-indicator--valid' };
        }

        if (valid === false) {
            return { icon: <SvgCross />, className: 'validation-indicator--invalid' };
        }

        return { icon: null, className: null };
    }, [valid]);

    return (
        <div className={classNames('validation-indicator', className)}>
            <span className='validation-indicator__icon'>{icon}</span>
            {label}
        </div>
    );
};

export default ValidationIndicator;
