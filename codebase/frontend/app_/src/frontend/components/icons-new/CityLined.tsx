import * as React from 'react';
import classNames from 'classnames';

const SvgCityLined = (props: React.SVGProps<SVGSVGElement>): JSX.Element => (
    <svg
        viewBox='1 1 22 22'
        width='1em'
        height='1em'
        aria-hidden='true'
        focusable='false'
        data-tid={props['data-tid'] ?? 'city-lined-icon'}
        className={classNames('icon-svg', props.className)}
    >
        <path d='M20.13 10.75h-1.25V3.39A1.39 1.39 0 0017.49 2H9.08a1.39 1.39 0 00-1.39 1.39V6H3.87A1.91 1.91 0 002 7.86v12.22A1.92 1.92 0 003.87 22h16.26a1.92 1.92 0 001.92-1.92v-7.42a1.91 1.91 0 00-1.92-1.91zM7.33 20H4V8h3.33zm9.55 0h-2.53v-3h-2v3H9.69V4h7.19zm3.17 0h-1.12v-7.25h1.12z' />
        <path d='M4.64 16h2v2h-2zm0-3.03h2v2h-2zm0-3.01h2v2h-2zm6.32 3.53h2v2h-2zm0-4.02h2v2h-2zm0-4.01h2v2h-2zm2.65 8.02h2v2h-2zm0-4.02h2v2h-2zm0-4.01h2v2h-2z' />
    </svg>
);

export default SvgCityLined;
