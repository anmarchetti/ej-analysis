import * as React from 'react';
import classNames from 'classnames';

const SvgHandBagLined = (props: React.SVGProps<SVGSVGElement>): JSX.Element => (
    <svg
        viewBox='1 1 22 22'
        width='1em'
        height='1em'
        aria-hidden='true'
        focusable='false'
        data-tid={props['data-tid'] ?? 'hand-bag-lined-icon'}
        className={classNames('icon-svg', props.className)}
    >
        <path
            d='M16.51 8.18l-4.55-3.87-4.55 3.87h9.1zm1.21 6.5a1 1 0 00.9-.62l.8-1.92c.24-.62.42-1.08.58-1.43a.7.7 0 00-.67-.53H4.67a.71.71 0 00-.67.53c.17.35.34.81.58 1.43l.12.31.68 1.61a1 1 0 00.91.62H11v-1a1 1 0 012 0v1zm-11.43 2a3 3 0 01-2-.77l.2 3.09a1 1 0 001 1h13a1 1 0 001-1l.2-3.07a3 3 0 01-2 .77z'
            fill='none'
        />
        <path d='M22 10.91a2.71 2.71 0 00-2.44-2.7s0-.05-.05-.06l-7-5.91a1 1 0 00-1.29 0L4.43 8.08s-.06.09-.1.13A2.72 2.72 0 002 10.9l.54 8.21a3 3 0 003 2.82h12.99a3 3 0 003-2.82L22 11v-.09zm-10 1.75a1 1 0 00-1 1v1H6.29a1 1 0 01-.91-.62l-.68-1.59-.12-.31c-.24-.62-.41-1.08-.58-1.43a.71.71 0 01.67-.53h14.66a.7.7 0 01.67.53c-.16.35-.34.81-.58 1.43l-.8 1.92a1 1 0 01-.9.62H13v-1a1 1 0 00-1-1.02zm0-8.35l4.55 3.87H7.41zM19.51 19a1 1 0 01-1 1h-13a1 1 0 01-1-1l-.2-3.07a3 3 0 002 .77h11.41a3 3 0 002-.77z' />
    </svg>
);

export default SvgHandBagLined;
