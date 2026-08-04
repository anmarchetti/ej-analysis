import * as React from 'react';
import classNames from 'classnames';

const SvgHotelBedFilled = (props: React.SVGProps<SVGSVGElement>): JSX.Element => (
    <svg
        {...props}
        viewBox='1 1 22 22'
        width='1em'
        height='1em'
        aria-hidden='true'
        focusable='false'
        className={classNames('icon-svg', props.className)}
        role='graphics-symbol'
        aria-label='bed-icon'
        data-tid={props['data-tid'] ?? 'hotel-bed-filled-icon'}
    >
        <path d='M18.1 7h-6.44a.7.7 0 00-.7.7v6.8H4.05v-9a1 1 0 00-2 0v13a1 1 0 002 0v-2H20v2a1 1 0 002 0v-7.65A3.85 3.85 0 0018.1 7z' />
        <circle cx={7.5} cy={10.46} r={2.5} />
    </svg>
);

export default SvgHotelBedFilled;
