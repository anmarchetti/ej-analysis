import * as React from 'react';
import classNames from 'classnames';

const SvgAirportLounge = (props: React.SVGProps<SVGSVGElement>): JSX.Element => (
    <svg
        viewBox='1 1 22 22'
        width='1em'
        height='1em'
        aria-hidden='true'
        focusable='false'
        data-tid={props['data-tid'] ?? 'airport-lounge-icon'}
        className={classNames('icon-svg', props.className)}
    >
        <path d='M20.49 3.43a1.83 1.83 0 00-2.18 1.43l-2.24 10.81H9.83a1.85 1.85 0 100 3.69h2.39l-.53 1.26a.5.5 0 00.46.69h3.33a.49.49 0 00.46-.69l-.52-1.26h1.93a1.85 1.85 0 001.75-.8 1.78 1.78 0 00.3-.77l2.52-12.18a1.85 1.85 0 00-1.43-2.18z' />
        <path d='M15.6 7a2.23 2.23 0 10-2.23-2.23A2.23 2.23 0 0015.6 7zm-1.37 8.19a2 2 0 001.88-1.6l.74-3.71A2 2 0 0013 9H9a1 1 0 000 2h3.61l-.44 2.19H7.48a1 1 0 00-.73.29l-4.41 4.39a1 1 0 101.41 1.41l2.1-2.09v3.28a1 1 0 002 0v-5.28z' />
    </svg>
);

export default SvgAirportLounge;
