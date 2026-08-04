import * as React from 'react';
import classNames from 'classnames';

const SvgLuggageBackpackFilled = (props: React.SVGProps<SVGSVGElement>): JSX.Element => (
    <svg
        width='1em'
        height='1em'
        aria-hidden='true'
        focusable='false'
        viewBox='0 0 19 21'
        fill='none'
        data-tid={props['data-tid'] ?? 'luggage-backpack-filled-icon'}
        className={classNames('icon-svg', props.className)}
    >
        <path
            fillRule='evenodd'
            clipRule='evenodd'
            d='M3.5 0.670044H6.5V3.67004H12.5V0.670044H15.5V4.08609C17.2659 4.85764 18.5 6.61973 18.5 8.67004V18.67C18.5 19.7746 17.6046 20.67 16.5 20.67H2.5C1.39543 20.67 0.5 19.7746 0.5 18.67V8.67004C0.5 6.61972 1.7341 4.85764 3.5 4.08609V0.670044ZM6.5 8.67004C4.84315 8.67004 3.5 10.0132 3.5 11.67V18.67H5.5V11.67C5.5 11.1178 5.94772 10.67 6.5 10.67H12.5C13.0523 10.67 13.5 11.1178 13.5 11.67V18.67H15.5V11.67C15.5 10.0132 14.1569 8.67004 12.5 8.67004H6.5ZM11.5 12.67H7.5V14.67H11.5V12.67Z'
        />
    </svg>
);

export default SvgLuggageBackpackFilled;
