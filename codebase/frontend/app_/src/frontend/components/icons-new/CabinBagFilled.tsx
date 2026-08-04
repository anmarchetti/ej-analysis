import * as React from 'react';
import classNames from 'classnames';

const SvgCabinBagFilled = (props: React.SVGProps<SVGSVGElement>): JSX.Element => (
    <svg
        viewBox='1 1 22 22'
        width='1em'
        height='1em'
        aria-hidden='true'
        focusable='false'
        data-tid={props['data-tid'] ?? 'cabin-bag-filled-icon'}
        className={classNames('icon-svg', props.className)}
    >
        <path d='M16 19.05h.35-.43zM7.64 19h.29zm.29 0h8zm8.75-10.68h-2.22V3.21A1.23 1.23 0 0013.22 2h-2.51a1.24 1.24 0 00-1.25 1.21v5.11H7.32A1.69 1.69 0 005.64 10v9.35A1.68 1.68 0 006.93 21a1 1 0 002 0h6a1 1 0 002 0 1.69 1.69 0 001.43-1.67V10a1.69 1.69 0 00-1.68-1.68zM11.46 4h1v4.3h-1zm4.9 6.35V15H7.64v-4.68z' />
    </svg>
);

export default SvgCabinBagFilled;
