import * as React from 'react';
import classNames from 'classnames';

const SvgShoppingBasketFilled = (props: React.SVGProps<SVGSVGElement>): JSX.Element => (
    <svg
        viewBox='1 1 22 22'
        width='1em'
        height='1em'
        aria-hidden='true'
        focusable='false'
        data-tid={props['data-tid'] ?? 'shopping-basket-filled-icon'}
        className={classNames('icon-svg', props.className)}
    >
        <path d='M21 8.32h-2.47l-4.59-4.6a1 1 0 00-1.42 1.42l3.18 3.18H8.25l3.18-3.18a1 1 0 000-1.42 1 1 0 00-1.41 0l-4.59 4.6H3a1 1 0 000 2h1l2.4 9.13a1.5 1.5 0 001.45 1.12h8.36a1.51 1.51 0 001.46-1.12L20 10.32h1a1 1 0 000-2zm-11 8.51a.5.5 0 01-.5.5.51.51 0 01-.5-.5V12a.51.51 0 01.5-.5.5.5 0 01.5.5zm2.5 0a.5.5 0 01-1 0V12a.5.5 0 011 0zm2.5 0a.5.5 0 01-1 0V12a.5.5 0 011 0z' />
    </svg>
);

export default SvgShoppingBasketFilled;
