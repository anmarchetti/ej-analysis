import classNames from 'classnames';

const LocalHotel = (props: React.SVGProps<SVGSVGElement>): JSX.Element => (
    <svg
        xmlns='http://www.w3.org/2000/svg'
        width='1em'
        height='1em'
        aria-hidden='true'
        focusable='false'
        data-tid={props['data-tid'] ?? 'local-hotel-icon'}
        className={classNames('icon-svg', props.className)}
        role='graphics-symbol'
        aria-label='hotel-icon'
    >
        <g>
            <path
                fillRule='evenodd'
                clipRule='evenodd'
                d='M1.33337 2H2.66671V10L7.33337 10V4.66667H13.3334C14.0698 4.66667 14.6667 5.26362 14.6667 6V10V11.3333V14H13.3334V11.3333H2.66671V14H1.33337V11.3333V10V2ZM5.00004 9.33333C5.92052 9.33333 6.66671 8.58714 6.66671 7.66667C6.66671 6.74619 5.92052 6 5.00004 6C4.07957 6 3.33337 6.74619 3.33337 7.66667C3.33337 8.58714 4.07957 9.33333 5.00004 9.33333Z'
                fill='#333333'
            />
        </g>
    </svg>
);

export default LocalHotel;
