import * as React from 'react';
import classNames from 'classnames';

const SvgUserFilled = (props: React.SVGProps<SVGSVGElement>): JSX.Element => (
    <svg
        viewBox='1 1 22 22'
        width='1em'
        height='1em'
        aria-hidden='true'
        focusable='false'
        data-tid={props['data-tid'] ?? 'user-filled-icon'}
        className={classNames('icon-svg', props.className)}
    >
        <path d='M15.14 12.09a5.49 5.49 0 10-6.2 0 7.62 7.62 0 00-7 7.59V22H22v-2.32a7.63 7.63 0 00-6.86-7.59z' />
    </svg>
);

export default SvgUserFilled;
