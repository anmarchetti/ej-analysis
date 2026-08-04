import * as React from 'react';
import classNames from 'classnames';

const SvgWarningLined = (props: React.SVGProps<SVGSVGElement>): JSX.Element => (
    <svg
        viewBox='1 1 22 22'
        width='1em'
        height='1em'
        aria-hidden='true'
        focusable='false'
        className={classNames('icon-svg', props.className)}
    >
        <path d='M12 16a1 1 0 101 1 1 1 0 00-1-1zm0-1.11a1 1 0 001-1V7a1 1 0 00-2 0v6.93a1 1 0 001 .96z' />
        <path d='M12 2a10 10 0 1010 10A10 10 0 0012 2zm0 18a8 8 0 118-8 8 8 0 01-8 8z' />
    </svg>
);

export default SvgWarningLined;
