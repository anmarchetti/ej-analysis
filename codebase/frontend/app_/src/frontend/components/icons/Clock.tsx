import * as React from 'react';

const IconClock = (props: React.SVGProps<SVGSVGElement>): JSX.Element => (
    <svg
        data-name='Layer 2'
        xmlns='http://www.w3.org/2000/svg'
        viewBox='0 0 24 24'
        data-tid={props['data-tid'] ?? 'clock-icon'}
    >
        <path d='M12,2A10,10,0,1,0,22,12,10,10,0,0,0,12,2Zm0,18a8,8,0,1,1,8-8A8,8,0,0,1,12,20Z' />
        <path d='M17.49,15.1,13,10.61V6.09a1,1,0,0,0-2,0V11h0a1,1,0,0,0,.29.72l4.78,4.78a1,1,0,0,0,1.42,0A1,1,0,0,0,17.49,15.1Z' />
    </svg>
);

export default IconClock;
