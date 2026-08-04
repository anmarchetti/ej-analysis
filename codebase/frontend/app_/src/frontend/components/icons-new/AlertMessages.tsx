import * as React from 'react';
import classNames from 'classnames';

const SvgAlertMessages = (props: React.SVGProps<SVGSVGElement>): JSX.Element => (
    <svg
        width={props.width ?? '20'}
        height={props.height ?? '20'}
        viewBox='0 0 20 20'
        fill='none'
        className={classNames('icon-svg', props.className)}
        xmlns='http://www.w3.org/2000/svg'
        data-tid={props['data-tid'] ?? 'alert-messages-icon'}
    >
        <path
            d='M10.8343 12.002C10.8009 12.4692 10.4672 12.8363 10 12.8363C9.53287 12.8363 9.19918 12.4692 9.16581 12.002L8.79876 5.32828C8.76539 4.6609 9.33266 4.09363 10 4.09363C10.634 4.09363 11.2347 4.6609 11.2013 5.32828L10.8343 12.002Z'
            fill='#FF6600'
        />
        <path
            d='M11.1513 14.7883C11.1513 15.4057 10.6507 15.9062 10.0501 15.9062C9.44945 15.9062 8.91555 15.4057 8.91555 14.7883C8.91555 14.1377 9.44945 13.6705 10.0501 13.6705C10.6507 13.6705 11.1513 14.1377 11.1513 14.7883Z'
            fill='#FF6600'
        />
        <path
            fillRule='evenodd'
            clipRule='evenodd'
            d='M17.0711 2.92893C15.1957 1.05357 12.6522 0 10 0C4.47715 0 0 4.47715 0 10C0 15.5228 4.47715 20 10 20C15.5228 20 20 15.5228 20 10C20 7.34784 18.9464 4.8043 17.0711 2.92893ZM2 10C2 5.58172 5.58172 2 10 2C14.4183 2 18 5.58172 18 10C18 12.1217 17.1571 14.1566 15.6569 15.6569C14.1566 17.1571 12.1217 18 10 18C5.58172 18 2 14.4183 2 10Z'
            fill='#FF6600'
        />
    </svg>
);

export default SvgAlertMessages;
