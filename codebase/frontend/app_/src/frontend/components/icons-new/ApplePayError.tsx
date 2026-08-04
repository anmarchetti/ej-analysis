import * as React from 'react';
import classNames from 'classnames';

const SvgApplePayError = (props: React.SVGProps<SVGSVGElement>): JSX.Element => (
    <svg
        width='24'
        height='24'
        viewBox='0 0 24 25'
        fill='none'
        xmlns='http://www.w3.org/2000/svg'
        className={classNames('icon-svg', props.className)}
        data-tid={props['data-tid'] ?? 'apple-pay-error-icon'}
    >
        <title>Apple Pay Error</title>
        <path d='M12 2.23047C6.47715 2.23047 2 6.70762 2 12.2305C2 17.7533 6.47715 22.2305 12 22.2305C17.5228 22.2305 22 17.7533 22 12.2305C22 9.5783 20.9464 7.03476 19.0711 5.1594C17.1957 3.28404 14.6522 2.23047 12 2.23047ZM11 10.9605V7.23047C11 6.67818 11.4477 6.23047 12 6.23047C12.5523 6.23047 13 6.67818 13 7.23047V14.1605C13 14.7128 12.5523 15.1605 12 15.1605C11.4477 15.1605 11 14.7128 11 14.1605V10.9605ZM12 18.2305C11.4477 18.2305 11 17.7828 11 17.2305C11 16.6782 11.4477 16.2305 12 16.2305C12.5523 16.2305 13 16.6782 13 17.2305C13 17.7828 12.5523 18.2305 12 18.2305Z' />
    </svg>
);

export default SvgApplePayError;
