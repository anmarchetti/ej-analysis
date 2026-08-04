import * as React from 'react';
import classNames from 'classnames';

const SvgHoldBagFilled = (props: React.SVGProps<SVGSVGElement>): JSX.Element => (
    <svg
        viewBox='1 1 22 22'
        width='1em'
        height='1em'
        aria-hidden='true'
        focusable='false'
        className={classNames('icon-svg', props.className)}
        data-tid='bag-icon'
    >
        <path d='M14.08 3H9.92A1.92 1.92 0 008 4.88V21h8V4.88A1.92 1.92 0 0014.08 3zM10 5h4v1.74h-4zM2 8.58v10.63A1.83 1.83 0 003.83 21H6V6.75H3.83A1.83 1.83 0 002 8.58zm18.17-1.83H18V21h2.17A1.83 1.83 0 0022 19.21V8.58a1.83 1.83 0 00-1.83-1.83z' />
    </svg>
);

export default SvgHoldBagFilled;
