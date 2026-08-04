import * as React from 'react';
import classNames from 'classnames';

const SvgUnderSeatBagFilled = (props: React.SVGProps<SVGSVGElement>): JSX.Element => (
    <svg
        viewBox='0 0 25 24'
        aria-hidden='true'
        focusable='false'
        data-tid={props['data-tid'] ?? 'under-seat-bag-filled-icon'}
        className={classNames('icon-svg', props.className)}
    >
        <path
            fillRule='evenodd'
            clipRule='evenodd'
            d='M6.5 2H9.5V5H15.5V2H18.5V5.41604C20.2659 6.1876 21.5 7.94968 21.5 10V20C21.5 21.1046 20.6046 22 19.5 22H5.5C4.39543 22 3.5 21.1046 3.5 20V10C3.5 7.94968 4.7341 6.1876 6.5 5.41604V2ZM9.5 10C7.84315 10 6.5 11.3431 6.5 13V20H8.5V13C8.5 12.4477 8.94772 12 9.5 12H15.5C16.0523 12 16.5 12.4477 16.5 13V20H18.5V13C18.5 11.3431 17.1569 10 15.5 10H9.5ZM14.5 14H10.5V16H14.5V14Z'
            fill='#FF4600'
        />
    </svg>
);

export default SvgUnderSeatBagFilled;
