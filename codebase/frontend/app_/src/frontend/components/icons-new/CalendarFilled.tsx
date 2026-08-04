import * as React from 'react';
import classNames from 'classnames';

const SvgCalendarFilled = (props: React.SVGProps<SVGSVGElement>): JSX.Element => (
    <svg
        viewBox='1 1 22 22'
        width='1em'
        height='1em'
        aria-hidden='true'
        focusable='false'
        data-tid={props['data-tid'] ?? 'calendar-filled-icon'}
        className={classNames('icon-svg', props.className)}
    >
        <path d='M20.72 4H18V2h-4v2h-4V2H6v2H3.28A1.29 1.29 0 002 5.33v15.38A1.29 1.29 0 003.28 22h17.44A1.29 1.29 0 0022 20.71V5.33A1.29 1.29 0 0020.72 4zm-5.66 11v-2h2v2zm2 1v2h-2v-2zm-6-1v-2h2v2zm2 1v2H11v-2zM7 15v-2h2v2zm2 1v2H7v-2zM4 6h2v2h4V6h4v2h4V6h2v3H4z' />
    </svg>
);

export default SvgCalendarFilled;
