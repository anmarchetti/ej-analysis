import * as React from 'react';
import classNames from 'classnames';

const SvgWarningFilled = ({ className, ...rest }: React.SVGProps<SVGSVGElement>): JSX.Element => (
    <svg
        viewBox='0 0 22 22'
        width='1em'
        height='1em'
        aria-hidden='true'
        focusable='false'
        data-tid={rest['data-tid'] ?? 'warning-filled-icon'}
        className={classNames('icon-svg', className)}
        {...rest}
    >
        <path
            stroke='null'
            d='M11 .5A10.875 10.5 0 1021.875 11 10.875 10.5 0 0011 .5zM9.913 9.666V5.75a1.087 1.05 0 012.174 0v7.276a1.087 1.05 0 01-2.175 0v-3.36zM11 17.3a1.087 1.05 0 111.087-1.05A1.087 1.05 0 0111 17.3z'
        />
    </svg>
);

export default SvgWarningFilled;
