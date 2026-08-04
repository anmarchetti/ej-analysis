import * as React from 'react';
import classNames from 'classnames';

const SvgFlightTrackerFilled = (props: React.SVGProps<SVGSVGElement>): JSX.Element => (
    <svg
        viewBox='1 1 22 22'
        width='1em'
        height='1em'
        aria-hidden='true'
        focusable='false'
        data-tid={props['data-tid'] ?? 'flight-tracker-filled-icon'}
        className={classNames('icon-svg', props.className)}
    >
        <path d='M10.56 11.28v2.88l2.88-1.44-2.88-1.44z' />
        <path d='M12 2a10 10 0 1010 10A10 10 0 0012 2zm2.88 11.61l-5.76 2.88v-6.1l5.76-2.88z' />
    </svg>
);

export default SvgFlightTrackerFilled;
