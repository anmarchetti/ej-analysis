import * as React from 'react';
import classNames from 'classnames';

const FphTick: React.FC<React.SVGProps<SVGSVGElement>> = props => (
    <svg
        viewBox='1 1 22 22'
        width='1em'
        height='1em'
        aria-hidden='true'
        focusable='false'
        data-tid={props['data-tid'] ?? 'tick-icon'}
        className={classNames('icon-svg', props.className)}
    >
        <path d='M18.0688 5.90685C17.7652 5.93909 17.4818 6.08239 17.2694 6.31202L9.319 14.8005L6.72912 12.0356C6.48834 11.7752 6.15285 11.6256 5.80052 11.6256C5.44818 11.6256 5.11269 11.7752 4.86994 12.0377C4.37636 12.5647 4.37636 13.3997 4.87191 13.9289L8.3823 17.6774C8.89426 18.2241 9.73593 18.2241 10.2479 17.6774L19.1284 8.20338C19.6241 7.67405 19.6241 6.83907 19.1286 6.30991C18.8878 6.04959 18.5523 5.8999 18.2 5.8999L18.0688 5.90685Z' />{' '}
    </svg>
);

export default FphTick;
