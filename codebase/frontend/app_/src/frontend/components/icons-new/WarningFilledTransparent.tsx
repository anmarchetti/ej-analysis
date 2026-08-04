import * as React from 'react';
import classNames from 'classnames';

const SvgWarningFilledTransparent = (props: React.SVGProps<SVGSVGElement>): JSX.Element => (
    <svg
        viewBox='0 0 16 16'
        width='15px'
        height='15px'
        aria-hidden='true'
        focusable='false'
        data-tid={props['data-tid'] ?? 'warning-filled-transparent-icon'}
        className={classNames('icon-svg', props.className)}
    >
        <path
            d='M8.62569 9.50153C8.60067 9.85191 8.3504 10.1272 8.00003 10.1272C7.64965 10.1272 7.39939 9.85191 7.37436 9.50153L7.09907 4.49621C7.07404 3.99567 7.49949 3.57022 8.00003 3.57022C8.47553 3.57022 8.92601 3.99567 8.90099 4.49621L8.62569 9.50153Z'
            fill='#FF0000'
        />
        <path
            d='M8.86345 11.5913C8.86345 12.0543 8.48805 12.4297 8.03757 12.4297C7.58709 12.4297 7.18666 12.0543 7.18666 11.5913C7.18666 11.1032 7.58709 10.7529 8.03757 10.7529C8.48805 10.7529 8.86345 11.1032 8.86345 11.5913Z'
            fill='#FF0000'
        />
        <path
            fillRule='evenodd'
            clipRule='evenodd'
            d='M13.3033 2.6967C11.8968 1.29018 9.98912 0.5 8 0.5C3.85786 0.5 0.5 3.85786 0.5 8C0.5 12.1421 3.85786 15.5 8 15.5C12.1421 15.5 15.5 12.1421 15.5 8C15.5 6.01088 14.7098 4.10322 13.3033 2.6967ZM2 8C2 4.68629 4.68629 2 8 2C11.3137 2 14 4.68629 14 8C14 9.5913 13.3679 11.1174 12.2426 12.2426C11.1174 13.3679 9.5913 14 8 14C4.68629 14 2 11.3137 2 8Z'
            fill='#FF0000'
        />
    </svg>
);

export default SvgWarningFilledTransparent;
