import * as React from 'react';
import classNames from 'classnames';

const SvgLocationPinFilled = (props: React.SVGProps<SVGSVGElement>): JSX.Element => (
    <svg
        viewBox='1 1 22 22'
        width='1em'
        height='1em'
        aria-hidden='true'
        focusable='false'
        data-tid={props['data-tid'] ?? 'location-pin-filled-icon'}
        className={classNames('icon-svg', props.className)}
        role='graphics-symbol'
        aria-label='location-icon'
    >
        <path d='M12 2C7.7 2 4.3 5.5 4.3 9.8c0 6.2 7 12 7 12 .4.3 1.1.3 1.5 0 0 0 7-5.8 7-12C19.7 5.5 16.3 2 12 2zm3.9 8c0 2.2-1.8 4-4 3.9-2.2 0-4-1.8-3.9-4 0-2.2 1.8-4 4-3.9 2.2 0 4 1.7 3.9 4 .1-.1 0 0 0 0z' />
    </svg>
);

export default SvgLocationPinFilled;
