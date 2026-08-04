import * as React from 'react';
import classNames from 'classnames';

const SvgFlightTrackerLined = (props: React.SVGProps<SVGSVGElement>): JSX.Element => (
    <svg
        viewBox='1 1 22 22'
        width='1em'
        height='1em'
        aria-hidden='true'
        focusable='false'
        data-tid={props['data-tid'] ?? 'flight-tracker-lined-icon'}
        className={classNames('icon-svg', props.className)}
    >
        <path d='M12 2a10 10 0 1010 10A10 10 0 0012 2zm0 18a8 8 0 118-8 8 8 0 01-8 8z' />
        <path d='M9.12 16.49l5.76-2.88v-6.1l-5.76 2.88zm1.44-5.21l2.88 1.44-2.88 1.44z' />
    </svg>
);

export default SvgFlightTrackerLined;
