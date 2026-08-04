import * as React from 'react';
import classNames from 'classnames';

const SvgHoldBagLined = (props: React.SVGProps<SVGSVGElement>): JSX.Element => (
    <svg
        viewBox='1 1 22 22'
        width='1em'
        height='1em'
        aria-hidden='true'
        focusable='false'
        data-tid={props['data-tid'] ?? 'hold-bag-lined-icon'}
        className={classNames('icon-svg', props.className)}
    >
        <path d='M20.17 6.75H16V4.88A1.92 1.92 0 0014.08 3H9.92A1.92 1.92 0 008 4.88v1.87H3.83A1.83 1.83 0 002 8.58v10.63A1.83 1.83 0 003.83 21h16.34A1.83 1.83 0 0022 19.21V8.58a1.83 1.83 0 00-1.83-1.83zM10 5h4v1.74h-4zm6 3.79V19H8V8.75zm-12 0h2V19H4zM20 19h-2V8.75h2z' />
    </svg>
);

export default SvgHoldBagLined;
