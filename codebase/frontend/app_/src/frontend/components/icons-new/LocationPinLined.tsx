import * as React from 'react';
import classNames from 'classnames';

const SvgLocationPinLined = (props: React.SVGProps<SVGSVGElement>): JSX.Element => (
    <svg
        viewBox='1 1 22 22'
        width='1em'
        height='1em'
        aria-hidden='true'
        focusable='false'
        data-tid={props['data-tid'] ?? 'location-pin-lined-icon'}
        className={classNames('icon-svg', props.className)}
    >
        <path d='M12 2a7.79 7.79 0 00-7.79 7.76c0 6.24 7 12 7 12a1.25 1.25 0 001.5 0s7-5.78 7-12A7.79 7.79 0 0012 2zm0 17.81C10 18 6.21 13.7 6.21 9.76a5.79 5.79 0 0111.58 0C17.79 13.7 14 18 12 19.78z' />
        <path d='M12 5.93a4 4 0 103.95 4 4 4 0 00-3.95-4zm0 5.91a2 2 0 111.95-2 2 2 0 01-1.95 2z' />
    </svg>
);

export default SvgLocationPinLined;
