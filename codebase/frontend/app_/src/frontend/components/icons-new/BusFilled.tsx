import * as React from 'react';
import classNames from 'classnames';

const SvgBusFilled = (props: React.SVGProps<SVGSVGElement>): JSX.Element => (
    <svg
        viewBox='1 1 22 22'
        width='1em'
        height='1em'
        aria-hidden='true'
        focusable='false'
        data-tid={props['data-tid'] ?? 'bus-filled-icon'}
        className={classNames('icon-svg', props.className)}
    >
        <path d='M19.68 6.36V4.15A2.15 2.15 0 0017.53 2H6.45A2.15 2.15 0 004.3 4.15v2.21a1 1 0 00-.73.94v2a1 1 0 00.73.93v7.27a2.13 2.13 0 00.91 1.75h-.13V21a1 1 0 001 1h2a1 1 0 001-1v-1.35h5.83V21a1 1 0 001 1h2a1 1 0 001-1v-1.75h-.14a2.13 2.13 0 00.91-1.75v-7.24a1 1 0 00.75-.94v-2a1 1 0 00-.75-.96zM8.3 17a1 1 0 111-1 1 1 0 01-1 1zm7.38 0a1 1 0 111-1 1 1 0 01-1 1zm2-4.69H6.3V4.15A.15.15 0 016.45 4h11.08a.15.15 0 01.15.15z' />
    </svg>
);

export default SvgBusFilled;
