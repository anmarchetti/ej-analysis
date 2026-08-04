import * as React from 'react';
import classNames from 'classnames';

const SvgBurger = (props: React.SVGProps<SVGSVGElement>): JSX.Element => (
    <svg
        viewBox='1 1 22 22'
        width='1em'
        height='1em'
        aria-hidden='true'
        focusable='false'
        data-tid={props['data-tid'] ?? 'burger-icon'}
        className={classNames('icon-svg', props.className)}
    >
        <path d='M3 8h18a1 1 0 000-2H3a1 1 0 000 2zm18 3H3a1 1 0 000 2h18a1 1 0 000-2zm0 5H3a1 1 0 000 2h18a1 1 0 000-2z' />
    </svg>
);

export default SvgBurger;
