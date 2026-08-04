import * as React from 'react';
import classNames from 'classnames';

const SvgRefresh = (props: React.SVGProps<SVGSVGElement>): JSX.Element => (
    <svg
        viewBox='1 1 22 22'
        width='1em'
        height='1em'
        aria-hidden='true'
        focusable='false'
        data-tid={props['data-tid'] ?? 'refresh-icon'}
        className={classNames('icon-svg', props.className)}
    >
        <path d='M20.63 11.34a1 1 0 00-1 1A7.63 7.63 0 1112 4.71 7.54 7.54 0 0117.46 7h-2.73a1 1 0 000 2h5a1 1 0 001-1V3a1 1 0 00-2 0v2.46a9.63 9.63 0 102.89 6.88 1 1 0 00-.99-1z' />
    </svg>
);

export default SvgRefresh;
