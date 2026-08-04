import * as React from 'react';
import classNames from 'classnames';

const SvgArrivalsLined = (props: React.SVGProps<SVGSVGElement>): JSX.Element => (
    <svg
        viewBox='1 1 22 22'
        width='1em'
        height='1em'
        aria-hidden='true'
        focusable='false'
        data-tid={props['data-tid'] ?? 'arrivals-lined-icon'}
        className={classNames('icon-svg', props.className)}
    >
        <path d='M2.48 10.76a1.63 1.63 0 00-.37 1c0 .87.64 1.58 1.86 2.12a6.36 6.36 0 00.63.25 10 10 0 003 .59h.08l11.4-.2c.51 0 2.07 0 2.66-1.22a2 2 0 00-.28-2.14 4.8 4.8 0 00-4.19-1.8h-2.71l-3.13-3.79a1.34 1.34 0 00-.51-.37l-2.16-.85a1.23 1.23 0 00-1.34.27A1.25 1.25 0 007.12 6l1.36 3.57H7.42L5.74 7.92a1.21 1.21 0 00-.91-.36H3.25a1.26 1.26 0 00-1.19 1.6zm2.07-1.2l1.68 1.68a1.23 1.23 0 00.92.36l2.43-.06a1.23 1.23 0 001-.55 1.25 1.25 0 00.13-1.14l-1.14-3L10 7l3.28 4a1.33 1.33 0 001 .46l3.06-.06a3 3 0 012.54 1l.05.08a2.47 2.47 0 01-.84.12l-11.4.2a7.61 7.61 0 01-2.42-.47l-.49-.2a3.15 3.15 0 01-.51-.27 1.23 1.23 0 00.26-1.14l-.29-1.15zM21 17.74H3a1 1 0 000 2h18a1 1 0 000-2z' />
    </svg>
);

export default SvgArrivalsLined;
