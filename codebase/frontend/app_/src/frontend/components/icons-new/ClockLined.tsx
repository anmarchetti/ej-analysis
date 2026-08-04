import * as React from 'react';
import classNames from 'classnames';

const SvgClockLined = (props: React.SVGProps<SVGSVGElement>): JSX.Element => (
    <svg
        viewBox='1 1 22 22'
        width='1em'
        height='1em'
        aria-hidden='true'
        focusable='false'
        data-tid={props['data-tid'] ?? 'clock-lined-icon'}
        className={classNames('icon-svg', props.className)}
    >
        <path d='M12 2a10 10 0 1010 10A10 10 0 0012 2zm0 18a8 8 0 118-8 8 8 0 01-8 8z' />
        <path d='M17.49 15.1L13 10.61V6.09a1 1 0 00-2 0V11a1 1 0 00.29.72l4.78 4.78a1 1 0 001.42 0 1 1 0 000-1.4z' />
    </svg>
);

export default SvgClockLined;
