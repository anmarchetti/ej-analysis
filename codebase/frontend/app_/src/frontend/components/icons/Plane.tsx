import * as React from 'react';
import classNames from 'classnames';

const IconPlane = (props: React.SVGProps<SVGSVGElement>): JSX.Element => (
    <svg
        aria-hidden='true'
        focusable='false'
        className={classNames('svg-inline--fa fa-plane-departure fa-w-20', props.className)}
        role='img'
        xmlns='http://www.w3.org/2000/svg'
        viewBox='0 0 24 24'
        data-tid={props['data-tid'] ?? 'plane-icon'}
    >
        <path
            fill='currentColor'
            d='M20.1 9.4h-3.4l-3.1-5.5c-.1-.1-.2-.2-.4-.2h-2.6c-.3 0-.5.3-.5.6l1.5 5.1h-2L8.3 7.6c-.1-.1-.2-.1-.4-.1H6.2c-.3 0-.5.2-.4.5l.9 3.2-.9 3.2c-.1.3.2.6.5.6H8c.2 0 .3-.1.4-.2l1.3-1.7h1.9L10 18.3c-.1.3.1.6.5.6h2.6c.2 0 .3-.1.4-.2l3.1-5.5H20c1.1 0 2.9-.9 2.9-1.9s-1.7-1.9-2.8-1.9zm0 2.8h-4L12.9 18h-1.7l1.6-5.7H9.1l-1.4 1.9h-.8l.8-2.9-.8-2.9h.8l1.4 1.9h3.7l-1.6-5.7h1.7l3.3 5.7h4c.8 0 1.9.7 1.9 1-.1.3-1.2.9-2 .9zM8.6 5.6H1.4c-.2 0-.4-.2-.4-.4s.2-.4.4-.4h7.2c.2 0 .4.2.4.4s-.2.4-.4.4zm0 11.2H1.4c-.2 0-.4-.2-.4-.4s.2-.4.4-.4h7.2c.2 0 .4.2.4.4 0 .3-.2.4-.4.4zm-4.1-3.2H1.4c-.2 0-.4-.2-.4-.4s.2-.4.4-.4h3.1c.2 0 .4.2.4.4s-.2.4-.4.4zm0-4.5H1.4c-.2 0-.4-.2-.4-.4s.2-.4.4-.4h3.1c.2 0 .4.2.4.4s-.2.4-.4.4zm.9 2.2h-4c-.2 0-.4-.1-.4-.3 0-.2.2-.4.4-.4h4c.2 0 .4.2.4.4-.1.2-.2.3-.4.3zm9.5 7.9l.7.4.4.7c0 .1.1.1.2.1s.2-.1.2-.1l.4-.7.7-.4c.1 0 .1-.1.1-.2s-.1-.2-.1-.2l-.7-.4-.4-.7c-.1-.2-.3-.2-.4 0l-.4.7-.7.4c-.1 0-.1.1-.1.2s0 .1.1.2zm1-.4l.1-.1.2-.4.2.4.1.1.4.2-.4.2-.1.1-.2.4-.2-.5-.1-.1-.4-.2.4-.1z'
        />
    </svg>
);

export default IconPlane;
