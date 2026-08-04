import * as React from 'react';

const RoundedPointer = (props: React.SVGProps<SVGSVGElement>): JSX.Element => (
    <svg
        width='13'
        height='7'
        viewBox='0 0 13 7'
        fill='none'
        className={props.className}
        data-tid='rounded-pointer-icon'
        aria-hidden='true'
    >
        <path
            d='M7.78377 5.87781L12.973 -6.19888e-06L-1.18307e-05 -7.33302e-06L5.18918 5.87781C5.90565 6.68937 7.06729 6.68937 7.78377 5.87781Z'
            fill='currentColor'
        />
    </svg>
);

export default RoundedPointer;
