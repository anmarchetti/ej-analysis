import * as React from 'react';
import classNames from 'classnames';

const SvgCityFilled = (props: React.SVGProps<SVGSVGElement>): JSX.Element => (
    <svg
        viewBox='1 1 22 22'
        width='1em'
        height='1em'
        aria-hidden='true'
        focusable='false'
        data-tid={props['data-tid'] ?? 'city-filled-icon'}
        className={classNames('icon-svg', props.className)}
    >
        <path d='M20.13 10.75h-1.25V3.39A1.39 1.39 0 0017.49 2H9.08a1.39 1.39 0 00-1.39 1.39V6H3.87A1.91 1.91 0 002 7.86v12.22A1.92 1.92 0 003.87 22h8.48v-5h2v5h5.78a1.92 1.92 0 001.92-1.92v-7.42a1.91 1.91 0 00-1.92-1.91zM6.64 18h-2v-2h2zm0-3h-2v-2h2zm0-3h-2v-2h2zM13 15.49h-2v-2h2zm0-4h-2v-2h2zm0-4h-2v-2h2zm2.65 8h-2v-2h2zm0-4h-2v-2h2zm0-4h-2v-2h2z' />
    </svg>
);

export default SvgCityFilled;
