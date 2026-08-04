import * as React from 'react';
import classNames from 'classnames';

const SvgParkingCardTypeParkAndRide = (props: React.SVGProps<SVGSVGElement>): JSX.Element => (
    <svg
        width='14'
        height='13'
        viewBox='0 0 14 13'
        fill='none'
        className={classNames('icon-svg', props.className)}
        xmlns='http://www.w3.org/2000/svg'
        role='graphics-symbol'
        aria-label='park-and-ride-icon'
        data-tid={props['data-tid'] ?? 'parking-card-type-park-and-ride-icon'}
    >
        <g id='Search &#38; Menu Swap'>
            <path
                id='Vector'
                d='M10.2214 2V4.22135H4.66671C2.82556 4.22135 1.33337 5.71354 1.33337 7.55469C1.33337 8.11458 1.48442 8.63281 1.72921 9.09636L3.10421 8.11719C3.04171 7.94011 3.00004 7.75521 3.00004 7.55729C3.00004 6.63542 3.74744 5.89063 4.66671 5.89063H10.2214V8.11198L14.6667 5.33333V4.77865L10.2214 2ZM12.8959 8.10677C12.9584 8.28385 13 8.46875 13 8.66667C13 9.58854 12.2552 10.3333 11.3334 10.3333H5.77869V8.11198L1.33337 10.8906V11.4453L5.77869 14.224V12.0026H11.3334C13.1745 12.0026 14.6667 10.5104 14.6667 8.66927C14.6667 8.10938 14.5157 7.59115 14.2709 7.1276L12.8959 8.10677Z'
                fill='#333333'
            />
        </g>
    </svg>
);

export default SvgParkingCardTypeParkAndRide;
