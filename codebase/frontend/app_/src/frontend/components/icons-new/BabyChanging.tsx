import * as React from 'react';
import classNames from 'classnames';

const SvgBabyChanging = (props: React.SVGProps<SVGSVGElement>): JSX.Element => (
    <svg
        viewBox='1 1 22 22'
        width='1em'
        height='1em'
        aria-hidden='true'
        focusable='false'
        data-tid={props['data-tid'] ?? 'baby-changing-icon'}
        className={classNames('icon-svg', props.className)}
    >
        <circle cx={18.69} cy={14.06} r={1} />
        <path d='M11.94 14a.45.45 0 00-.11.19 1 1 0 00-.14.48 1 1 0 001 1h3.4a1 1 0 001-1v-2.5a.5.5 0 00-.5-.5.5.5 0 00-.5.5v1.5h-2.4l.1-.1a.51.51 0 000-.71l-1.68-1.68a.5.5 0 00-.71 0 .48.48 0 000 .7l1.33 1.33zm7.25 2.64h-7a.5.5 0 00-.5.5.5.5 0 00.5.5h7a.5.5 0 00.5-.5.5.5 0 00-.5-.5zM10.42 4.71a1.36 1.36 0 10-1.36-1.35 1.35 1.35 0 001.36 1.35z' />
        <path d='M13.33 10.31a1 1 0 000-1.44 29.06 29.06 0 00-4-3.73A1.7 1.7 0 007 5.67L4.63 9.34a2.33 2.33 0 00-.3 1.48c.42 7.72.35 5.51.35 10a1.19 1.19 0 102.37 0c0-4.66 0-2.46-.19-9.17 0-.15-.13.09 2.2-3.58A.34.34 0 019.58 8l2.31 2.31a1 1 0 001.44 0z' />
    </svg>
);

export default SvgBabyChanging;
