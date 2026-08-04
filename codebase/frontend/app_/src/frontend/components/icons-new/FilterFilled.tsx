import * as React from 'react';
import classNames from 'classnames';

const SvgFilterFilled = (props: React.SVGProps<SVGSVGElement>): JSX.Element => (
    <svg
        viewBox='1 1 22 22'
        width='1em'
        height='1em'
        aria-hidden='true'
        focusable='false'
        data-tid={props['data-tid'] ?? 'filter-filled-icon'}
        className={classNames('icon-svg', props.className)}
    >
        <path d='M2.09 2.57A.84.84 0 012.92 2h18.16a.84.84 0 01.83.55.81.81 0 01-.2 1l-7 7v6.9a.86.86 0 01-.27.63l-3.63 3.63a.84.84 0 01-.64.27.91.91 0 01-.35-.07.84.84 0 01-.55-.83V10.55l-7-7a.81.81 0 01-.18-.98z' />
    </svg>
);

export default SvgFilterFilled;
