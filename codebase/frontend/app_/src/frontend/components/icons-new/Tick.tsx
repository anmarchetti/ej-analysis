import * as React from 'react';
import classNames from 'classnames';

const SvgTick: React.FC<React.SVGProps<SVGSVGElement>> = props => (
    <svg
        viewBox='1 1 22 22'
        width='1em'
        height='1em'
        aria-hidden='true'
        focusable='false'
        data-tid={props['data-tid'] ?? 'tick-icon'}
        className={classNames('icon-svg', props.className)}
    >
        <path d='M21.71 5a1 1 0 00-1.42 0l-12 12-4.6-4.61a1 1 0 00-1.42 1.42l5.32 5.31a1 1 0 001.41 0L21.71 6.36a1 1 0 000-1.36z' />
    </svg>
);

export default SvgTick;
