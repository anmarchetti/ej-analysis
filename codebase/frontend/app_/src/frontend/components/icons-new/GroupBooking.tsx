import * as React from 'react';
import classNames from 'classnames';

const SvgGroupBooking = (props: React.SVGProps<SVGSVGElement>): JSX.Element => (
    <svg
        viewBox='1 1 22 22'
        width='1em'
        height='1em'
        aria-hidden='true'
        focusable='false'
        data-tid={props['data-tid'] ?? 'group-booking-icon'}
        className={classNames('icon-svg', props.className)}
    >
        <path d='M21 13.87a2.72 2.72 0 00-2.49-2.7 2 2 0 10-2.18 0 2.7 2.7 0 00-2 1.1 3.37 3.37 0 00-.95-.22 2.42 2.42 0 001.09-2 2.45 2.45 0 10-3.81 2 3.57 3.57 0 00-1 .22 2.69 2.69 0 00-1.95-1.1 2 2 0 10-3.05-1.64 2 2 0 00.87 1.64A2.72 2.72 0 003 13.87v.82h4.6a2.92 2.92 0 00-.09.73v1h8.94v-1a3.47 3.47 0 00-.08-.73H21z' />
    </svg>
);

export default SvgGroupBooking;
