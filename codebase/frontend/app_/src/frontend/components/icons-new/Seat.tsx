import * as React from 'react';
import classNames from 'classnames';

const SvgSeat = (props: React.SVGProps<SVGSVGElement>): JSX.Element => (
    <svg
        viewBox='1 1 22 22'
        width='1em'
        height='1em'
        aria-hidden='true'
        focusable='false'
        data-tid={props['data-tid'] ?? 'seat-icon'}
        className={classNames('icon-svg', props.className)}
    >
        <path d='M18.6 16.25H5.39a2 2 0 000 4H18.6a2 2 0 000-4z' />
        <rect x={4.5} y={3.75} width={15} height={12} rx={1.3} />
        <path d='M4 14.91V6.38a1 1 0 00-2 0v8.53a1 1 0 002 0zm17-9.62a1 1 0 00-1 1v8.53a1 1 0 102 0V6.29a1 1 0 00-1-1z' />
    </svg>
);

export default SvgSeat;
