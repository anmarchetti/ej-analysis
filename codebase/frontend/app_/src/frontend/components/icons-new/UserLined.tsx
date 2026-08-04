import * as React from 'react';
import classNames from 'classnames';

const SvgUserLined = (props: React.SVGProps<SVGSVGElement>): JSX.Element => (
    <svg
        viewBox='1 1 22 22'
        width='1em'
        height='1em'
        aria-hidden='true'
        focusable='false'
        data-tid={props['data-tid'] ?? 'user-lined-icon'}
        className={classNames('icon-svg', props.className)}
    >
        <path d='M15.14 12.09a5.49 5.49 0 10-6.2 0 7.62 7.62 0 00-7 7.59V22H22v-2.32a7.63 7.63 0 00-6.86-7.59zM12.05 4a3.5 3.5 0 11-3.5 3.5 3.5 3.5 0 013.5-3.5zM20 20H4v-.28a5.63 5.63 0 015.62-5.63h4.82A5.63 5.63 0 0120 19.68z' />
    </svg>
);

export default SvgUserLined;
