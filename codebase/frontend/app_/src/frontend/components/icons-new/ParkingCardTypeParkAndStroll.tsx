import * as React from 'react';
import classNames from 'classnames';

const SvgParkingCardTypeParkAndStroll = (props: React.SVGProps<SVGSVGElement>): JSX.Element => (
    <svg
        width='14'
        height='14'
        viewBox='0 0 14 14'
        fill='none'
        className={classNames('icon-svg', props.className)}
        xmlns='http://www.w3.org/2000/svg'
        role='graphics-symbol'
        aria-label='park-and-stroll-icon'
        data-tid={props['data-tid'] ?? 'parking-card-type-park-and-stroll-icon'}
    >
        <g id='Flight Alt 2'>
            <path
                id='Vector'
                d='M6.22637 14.3337C6.46637 14.3337 6.68637 14.207 6.8197 14.007L9.94637 9.00033H13.613C14.1664 9.00033 14.613 8.55366 14.613 8.00033C14.613 7.44699 14.1664 7.00033 13.613 7.00033H9.94637L6.8197 1.99366C6.69304 1.79366 6.46637 1.66699 6.22637 1.66699C5.7597 1.66699 5.4197 2.12033 5.5597 2.57366L6.94637 7.00033H3.2797L2.3797 5.80033C2.3197 5.71366 2.2197 5.66699 2.11304 5.66699H1.7197C1.4997 5.66699 1.3397 5.88033 1.3997 6.09366L1.94637 8.00033L1.3997 9.90699C1.3397 10.1203 1.4997 10.3337 1.7197 10.3337H2.11304C2.2197 10.3337 2.3197 10.287 2.3797 10.2003L3.2797 9.00033H6.94637L5.5597 13.427C5.4197 13.8803 5.7597 14.3337 6.22637 14.3337Z'
                fill='#333333'
            />
        </g>
    </svg>
);

export default SvgParkingCardTypeParkAndStroll;
