import * as React from 'react';
import classNames from 'classnames';

const SvgAccessibilty = (props: React.SVGProps<SVGSVGElement>): JSX.Element => (
    <svg
        viewBox='1 1 22 22'
        width='1em'
        height='1em'
        aria-hidden='true'
        focusable='false'
        data-tid={props['data-tid'] ?? 'accessibilty-icon'}
        className={classNames('icon-svg', props.className)}
    >
        <circle cx={12.09} cy={4} r={2} />
        <path d='M19.37 13.81h-6.19v-2.52h2.57a1 1 0 000-2h-2.57v-1.6a1 1 0 00-2 0v7.12a1 1 0 001 1h6.19V21a1 1 0 002 0v-6.19a1 1 0 00-1-1z' />
        <path d='M14.53 17.94a4.94 4.94 0 01-8.08-5.69A4.89 4.89 0 019 10.32 1 1 0 009.56 9a1 1 0 00-1.27-.61 6.86 6.86 0 00-3.51 2.72 6.95 6.95 0 006.47 10.74 7 7 0 001.61-.35 6.84 6.84 0 003.27-2.4 1 1 0 10-1.6-1.2z' />
    </svg>
);

export default SvgAccessibilty;
