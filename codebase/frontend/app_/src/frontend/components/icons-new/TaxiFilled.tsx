import * as React from 'react';
import classNames from 'classnames';

const SvgTaxiFilled = (props: React.SVGProps<SVGSVGElement>): JSX.Element => (
    <svg
        viewBox='1 1 22 22'
        aria-hidden='true'
        focusable='false'
        data-tid={props['data-tid'] ?? 'taxi-filled-icon'}
        className={classNames('icon-svg', props.className)}
    >
        <path d='M20.57 9.13L20.41 9h.49a1 1 0 000-2h-1.85a3.53 3.53 0 00-3.48-3H8.48A3.53 3.53 0 005 7H3a1 1 0 000 2h.83a3.23 3.23 0 00-.4.35A5 5 0 002 12v4.73a2.25 2.25 0 001.11 1.93V21a1 1 0 001 1h2a1 1 0 001-1v-2h9.75v2a1 1 0 001 1h2a1 1 0 001-1v-2.32A2.25 2.25 0 0022 16.73V12a4.49 4.49 0 00-1.43-2.87zM6.11 15a1 1 0 111-1 1 1 0 01-1 1zM15 14a1 1 0 01-1 1h-3.9a1 1 0 01-1-1 1 1 0 011-1H14a1 1 0 011 1zM7 8v-.45A1.54 1.54 0 018.48 6h7.09a1.54 1.54 0 011.54 1.54V8zm10.92 7a1 1 0 111-1 1 1 0 01-1.06 1zm-3.4-12.14a.86.86 0 00-.85-.86h-3.29a.87.87 0 00-.86.86V4h5z' />
    </svg>
);

export default SvgTaxiFilled;
