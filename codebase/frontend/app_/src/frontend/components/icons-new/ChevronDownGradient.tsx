import React, { FC, SVGProps } from 'react';
import classNames from 'classnames';

const SvgChevronDownGradient: FC<SVGProps<SVGSVGElement>> = props => (
    <svg
        width='32'
        height='32'
        viewBox='0 0 32 32'
        fill='none'
        xmlns='http://www.w3.org/2000/svg'
        className={classNames('icon-svg', props.className)}
        focusable='false'
        aria-hidden='true'
        data-tid='svg-chevron-down-gradient'
    >
        <circle cx='16' cy='16' r='15' stroke='url(#paint0_linear_3107_4797)' strokeWidth='2' />
        <path
            d='M20.9358 13.6465C21.1336 13.8445 21.127 14.1672 20.9456 14.3486L16.3557 18.9385C16.161 19.1332 15.8473 19.1332 15.6526 18.9385L11.0627 14.3486C10.8684 14.154 10.8685 13.8411 11.0627 13.6465C11.2575 13.4517 11.5711 13.4517 11.7659 13.6465L15.9993 17.8799L20.2327 13.6465C20.4274 13.4517 20.7411 13.4517 20.9358 13.6465Z'
            stroke='url(#paint1_linear_3107_4797)'
        />
        <defs>
            <linearGradient id='paint0_linear_3107_4797' x1='32' y1='32' x2='0' y2='0' gradientUnits='userSpaceOnUse'>
                <stop stopColor='#F2C173' />
                <stop offset='1' stopColor='#FF6600' />
            </linearGradient>
            <linearGradient
                id='paint1_linear_3107_4797'
                x1='10.417'
                y1='19.585'
                x2='16.1796'
                y2='9.81333'
                gradientUnits='userSpaceOnUse'
            >
                <stop stopColor='#F2C173' />
                <stop offset='1' stopColor='#FF6600' />
            </linearGradient>
        </defs>
    </svg>
);

export default SvgChevronDownGradient;
