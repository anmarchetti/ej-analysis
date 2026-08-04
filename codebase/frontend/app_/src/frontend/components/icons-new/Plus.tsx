import * as React from 'react';
import classNames from 'classnames';

const SvgPlus = (props: React.SVGProps<SVGSVGElement>): JSX.Element => (
    <svg
        viewBox='1 1 22 22'
        width='1em'
        height='1em'
        aria-hidden='true'
        focusable='false'
        data-tid={props['data-tid'] ?? 'plus-icon'}
        className={classNames('icon-svg', props.className)}
    >
        <path d='M21 11h-8V3a1 1 0 00-2 0v8H3a1 1 0 000 2h8v8a1 1 0 002 0v-8h8a1 1 0 000-2z' />
    </svg>
);

export default SvgPlus;
