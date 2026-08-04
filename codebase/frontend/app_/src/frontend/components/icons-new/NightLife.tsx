import * as React from 'react';
import classNames from 'classnames';

const SvgNightLife = (props: React.SVGProps<SVGSVGElement>): JSX.Element => (
    <svg
        viewBox='1 1 22 22'
        width='1em'
        height='1em'
        aria-hidden='true'
        focusable='false'
        data-tid={props['data-tid'] ?? 'night-life-icon'}
        className={classNames('icon-svg', props.className)}
    >
        <path d='M17.09 2.88a4 4 0 00-3.81 2.85H8.34L4.76 2.15a.5.5 0 00-.71 0 .5.5 0 000 .7l2.88 2.88h-4l4.85 5.43L10 13.6V20H8.05a1 1 0 000 2h5.81a1 1 0 000-2H12v-6.44l3-3.33a4 4 0 002.17.65 4 4 0 000-8zM8.66 9.16L7.38 7.73h5.81a4.07 4.07 0 00.62 1.43z' />
    </svg>
);

export default SvgNightLife;
