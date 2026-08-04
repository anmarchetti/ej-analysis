import * as React from 'react';
import classNames from 'classnames';

const SvgInfoFilled = ({ className, ...rest }: React.SVGProps<SVGSVGElement>): JSX.Element => (
    <svg
        viewBox='1 1 22 22'
        width='1em'
        height='1em'
        aria-hidden='true'
        focusable='false'
        className={classNames('icon-svg', className)}
        data-tid={rest['data-tid'] ?? 'info-filled-icon'}
        {...rest}
    >
        <path d='M12 2a10 10 0 1010 10A10 10 0 0012 2zm0 4a1 1 0 11-1 1 1 1 0 011-1zm1 7.26V17a1 1 0 11-2 0v-6.92a1 1 0 012 0z' />
    </svg>
);

export default SvgInfoFilled;
