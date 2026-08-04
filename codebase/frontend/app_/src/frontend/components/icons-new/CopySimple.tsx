import * as React from 'react';
import classNames from 'classnames';

const SvgCopySimple = (props: React.SVGProps<SVGSVGElement>): JSX.Element => (
    <svg
        width='1em'
        height='1em'
        viewBox='0 0 14 14'
        fill='none'
        aria-hidden='true'
        focusable='false'
        data-tid={props['data-tid'] ?? 'copy-simple-icon'}
        className={classNames('icon-svg', props.className)}
    >
        <g>
            <path
                fillRule='evenodd'
                clipRule='evenodd'
                d='M12.3333 1.66668H4.33333V9.66668H12.3333V1.66668ZM4.33333 0.333344C3.59695 0.333344 3 0.930297 3 1.66668V9.66668C3 10.4031 3.59695 11 4.33333 11H12.3333C13.0697 11 13.6667 10.4031 13.6667 9.66668V1.66668C13.6667 0.930297 13.0697 0.333344 12.3333 0.333344H4.33333Z'
                fill='#FF6600'
            />
            <path
                fillRule='evenodd'
                clipRule='evenodd'
                d='M1.66634 3V11.6667C1.66634 12.0349 1.96482 12.3333 2.33301 12.3333H10.9997V13.6667H2.33301C1.22844 13.6667 0.333008 12.7712 0.333008 11.6667V3H1.66634Z'
                fill='#FF6600'
            />
        </g>
    </svg>
);

export default SvgCopySimple;
