import * as React from 'react';
import classNames from 'classnames';

const SvgEditFilled = (props: React.SVGProps<SVGSVGElement>): JSX.Element => (
    <svg
        viewBox='1 1 22 22'
        width='1em'
        height='1em'
        aria-hidden='true'
        focusable='false'
        data-tid={props['data-tid'] ?? 'edit-filled-icon'}
        className={classNames('icon-svg', props.className)}
    >
        <path d='M21.66 6.15l-3.82-3.82a1.06 1.06 0 00-1.49 0l-2.52 2.54 5.29 5.29 2.52-2.52a1 1 0 00.02-1.49zM2.46 16.24a1.27 1.27 0 00-.37.86v3.66A1.18 1.18 0 003.25 22h3.62a1.23 1.23 0 00.86-.37l9.75-9.75-5.29-5.37z' />
    </svg>
);

export default SvgEditFilled;
