import * as React from 'react';
import classNames from 'classnames';

const SvgGym = (props: React.SVGProps<SVGSVGElement>): JSX.Element => (
    <svg
        viewBox='1 1 22 22'
        width='1em'
        height='1em'
        aria-hidden='true'
        focusable='false'
        data-tid={props['data-tid'] ?? 'gym-icon'}
        className={classNames('icon-svg', props.className)}
    >
        <path d='M21 11h-1V9a1 1 0 00-2 0v2-3a1 1 0 00-2 0v3H8V8a1 1 0 00-2 0v3-2a1 1 0 00-2 0v2H3a1 1 0 000 2h1v2a1 1 0 002 0v-2 3a1 1 0 002 0v-3h8v3a1 1 0 002 0v-3 2a1 1 0 002 0v-2h1a1 1 0 000-2z' />
    </svg>
);

export default SvgGym;
