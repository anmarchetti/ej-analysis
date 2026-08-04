import * as React from 'react';
import classNames from 'classnames';

const SvgClockFilled = (props: React.SVGProps<SVGSVGElement>): JSX.Element => (
    <svg
        viewBox='1 1 22 22'
        width='1em'
        height='1em'
        aria-hidden='true'
        focusable='false'
        data-tid={props['data-tid'] ?? 'clock-filled-icon'}
        className={classNames('icon-svg', props.className)}
    >
        <path d='M12 2a10 10 0 1010 10A10 10 0 0012 2zm5.49 14.51a1 1 0 01-1.42 0l-4.78-4.78A1 1 0 0111 11V6.09a1 1 0 012 0v4.52l4.49 4.49a1 1 0 010 1.41z' />
    </svg>
);

export default SvgClockFilled;
