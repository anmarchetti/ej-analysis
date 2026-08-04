import * as React from 'react';
import classNames from 'classnames';

const SvgNightsLined = (props: React.SVGProps<SVGSVGElement>): JSX.Element => (
    <svg
        viewBox='1 1 22 22'
        width='1em'
        height='1em'
        aria-hidden='true'
        focusable='false'
        data-tid={props['data-tid'] ?? 'nights-lined-icon'}
        className={classNames('icon-svg', props.className)}
    >
        <path d='M13.05 22a10 10 0 01-4-.81 10.12 10.12 0 01-5.43-5.43 10 10 0 01-.81-4 10 10 0 012-6.14A10.13 10.13 0 0110.12 2a1 1 0 011.08.35 1 1 0 01.05 1.14A8.38 8.38 0 009.9 8.12a8.56 8.56 0 001.16 4.35 8.76 8.76 0 003.17 3.17 8.66 8.66 0 004.35 1.16 8.33 8.33 0 001.42-.12 1 1 0 011 .49 1 1 0 01-.1 1.13 10.18 10.18 0 01-7.85 3.7zM8.36 5a8.22 8.22 0 00-1.89 1.88 7.9 7.9 0 00-1.63 4.93A8.08 8.08 0 005.49 15a8.47 8.47 0 001.75 2.62 8.37 8.37 0 002.63 1.76 8.17 8.17 0 006.69-.14 9.75 9.75 0 00.9-.49 10.43 10.43 0 01-4.23-1.37A10.72 10.72 0 017.9 8.12 10.59 10.59 0 018.36 5z' />
    </svg>
);

export default SvgNightsLined;
