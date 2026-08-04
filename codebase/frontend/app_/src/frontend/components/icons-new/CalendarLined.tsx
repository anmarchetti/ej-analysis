import * as React from 'react';
import classNames from 'classnames';

const SvgCalendarLined = (props: React.SVGProps<SVGSVGElement>): JSX.Element => (
    <svg
        xmlns='http://www.w3.org/2000/svg'
        width='1em'
        height='1em'
        viewBox='0 0 21 20'
        className={classNames('icon-svg', props.className)}
        role='graphics-symbol'
        aria-label='calendar-icon'
        data-tid={props['data-tid'] ?? 'calendar-lined-icon'}
    >
        <g>
            <path d='M7.16675 1.66675H5.50008V3.33341H3.83341C2.91294 3.33341 2.16675 4.07961 2.16675 5.00008V8.33342V16.6667C2.16675 17.5872 2.91294 18.3334 3.83342 18.3334H17.1667C18.0872 18.3334 18.8334 17.5872 18.8334 16.6667V8.33342V5.00008C18.8334 4.07961 18.0872 3.33341 17.1667 3.33341H15.5001V1.66675H13.8334V3.33341H7.16675V1.66675ZM3.83341 16.6667V8.33342L17.1667 8.33342V16.6667H3.83341ZM8.00008 10.0001V11.6667H6.33342V10.0001H8.00008ZM8.00008 15.0001V13.3334H6.33342V15.0001H8.00008ZM9.66675 10.0001H11.3334V11.6667H9.66675V10.0001ZM11.3334 13.3334H9.66675V15.0001H11.3334V13.3334ZM14.6667 10.0001V11.6667H13.0001V10.0001H14.6667ZM14.6667 15.0001V13.3334H13.0001V15.0001H14.6667Z' />
        </g>
    </svg>
);

export default SvgCalendarLined;
