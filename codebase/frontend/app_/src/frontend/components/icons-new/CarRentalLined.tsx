import * as React from 'react';
import classNames from 'classnames';

const SvgCarRentalLined = (props: React.SVGProps<SVGSVGElement>): JSX.Element => (
    <svg
        viewBox='1 1 22 22'
        width='1em'
        height='1em'
        aria-hidden='true'
        focusable='false'
        data-tid={props['data-tid'] ?? 'car-rental-lined-icon'}
        className={classNames('icon-svg', props.className)}
    >
        <circle cx={6.11} cy={12.96} r={1} />
        <circle cx={17.86} cy={12.96} r={1} />
        <path d='M14 12h-3.9a1 1 0 000 2H14a1 1 0 000-2z' />
        <path d='M20.57 8.12L20.41 8h.49a1 1 0 000-2h-1.85a3.52 3.52 0 00-3.48-3H8.48A3.52 3.52 0 005 6H3a1 1 0 000 2h.83a4.23 4.23 0 00-.4.34A5.09 5.09 0 002 11v4.72a2.25 2.25 0 001.11 1.94V20a1 1 0 001 1h2a1 1 0 001-1v-2h9.75v2a1 1 0 001 1h2a1 1 0 001-1v-2.32a2.26 2.26 0 001.14-2V11a4.5 4.5 0 00-1.43-2.88zM4 15.72v-4.51a3 3 0 01.82-1.43A2.92 2.92 0 016.3 9h11.49a2.38 2.38 0 011.44.61A2.5 2.5 0 0120 11.1v4.62a.26.26 0 01-.26.26H4.26a.26.26 0 01-.26-.26zm2.94-9.17A1.54 1.54 0 018.48 5h7.09a1.54 1.54 0 011.54 1.54V7H6.94z' />
    </svg>
);

export default SvgCarRentalLined;
