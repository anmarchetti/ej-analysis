import * as React from 'react';
import classNames from 'classnames';

const SvgTaxiLined = (props: React.SVGProps<SVGSVGElement>): JSX.Element => (
    <svg
        viewBox='1 1 22 22'
        width='1em'
        height='1em'
        aria-hidden='true'
        focusable='false'
        data-tid={props['data-tid'] ?? 'taxi-lined-icon'}
        className={classNames('icon-svg', props.className)}
    >
        <circle cx={6.11} cy={13.96} r={1} />
        <circle cx={17.86} cy={13.96} r={1} />
        <path d='M14 13h-3.9a1 1 0 000 2H14a1 1 0 000-2z' />
        <path d='M20.57 9.13L20.41 9h.49a1 1 0 000-2h-1.85a3.53 3.53 0 00-3.48-3H8.48A3.53 3.53 0 005 7H3a1 1 0 000 2h.83a3.23 3.23 0 00-.4.35A5 5 0 002 12v4.73a2.25 2.25 0 001.11 1.93V21a1 1 0 001 1h2a1 1 0 001-1v-2h9.75v2a1 1 0 001 1h2a1 1 0 001-1v-2.32A2.25 2.25 0 0022 16.73V12a4.49 4.49 0 00-1.43-2.87zM6.94 7.55A1.54 1.54 0 018.48 6h7.09a1.54 1.54 0 011.54 1.54V8H6.94zM20 16.73a.26.26 0 01-.26.26H4.26a.26.26 0 01-.26-.26v-4.52a3 3 0 01.82-1.43A3.08 3.08 0 016.3 10h11.49a2.45 2.45 0 011.44.61 2.52 2.52 0 01.77 1.5zM14.52 2.86a.86.86 0 00-.85-.86h-3.29a.87.87 0 00-.86.86V4h5z' />
    </svg>
);

export default SvgTaxiLined;
