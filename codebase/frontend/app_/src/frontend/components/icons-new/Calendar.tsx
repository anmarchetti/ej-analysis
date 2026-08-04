import * as React from 'react';
import classNames from 'classnames';

const SvgCalendar = (props: React.SVGProps<SVGSVGElement>): JSX.Element => (
    <svg
        {...props}
        viewBox='1 1 22 22'
        width='1em'
        height='1em'
        aria-hidden='true'
        focusable='false'
        data-tid={props['data-tid'] ?? 'calendar-icon'}
        className={classNames('icon-svg', props.className)}
    >
        <path
            fillRule='evenodd'
            clipRule='evenodd'
            d='M8 2H6V4H4C2.89543 4 2 4.89543 2 6V10V20C2 21.1046 2.89543 22 4 22H20C21.1046 22 22 21.1046 22 20V10V6C22 4.89543 21.1046 4 20 4H18V2H16V4H8V2ZM4 20V10L20 10V20H4ZM9 12V14H7V12H9ZM9 18V16H7V18H9ZM11 12H13V14H11V12ZM13 16H11V18H13V16ZM17 12V14H15V12H17ZM17 18V16H15V18H17Z'
        />
    </svg>
);

export default SvgCalendar;
