import * as React from 'react';
import classNames from 'classnames';

const SvgChildCircleFilled = (props: React.SVGProps<SVGSVGElement>): JSX.Element => (
    <svg
        width='24'
        height='24'
        viewBox='0 0 24 24'
        aria-hidden='true'
        focusable='false'
        data-tid={'child-circle-icon'}
        className={classNames('icon-svg', props.className)}
    >
        <rect width='24' height='24' rx='12' fill='#333333' />
        <path
            d='M7.88791 7.0153C8.12085 6.78374 8.49707 6.78374 8.73001 7.0153L10.9995 9.28481H13.0062L15.2757 7.0153C15.5087 6.78374 15.8849 6.78374 16.1178 7.0153C16.3416 7.24679 16.3416 7.61398 16.1178 7.84547L13.7946 10.1687V17.3356C13.7946 17.6654 13.5272 17.9328 13.1974 17.9328C12.8675 17.9328 12.6001 17.6654 12.6001 17.3356V13.991H11.4056V17.3356C11.4056 17.6654 11.1382 17.9328 10.8084 17.9328C10.4786 17.9328 10.2112 17.6654 10.2112 17.3356V10.1687L7.88791 7.85741C7.65634 7.62446 7.65634 7.24825 7.88791 7.0153ZM12.0029 6C12.8275 6 13.496 6.66848 13.496 7.49309C13.496 8.31771 12.8275 8.98619 12.0029 8.98619C11.1783 8.98619 10.5098 8.31771 10.5098 7.49309C10.5098 6.66848 11.1783 6 12.0029 6Z'
            fill='white'
        />
    </svg>
);

export default SvgChildCircleFilled;
