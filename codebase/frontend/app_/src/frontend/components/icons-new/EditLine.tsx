import * as React from 'react';
import classNames from 'classnames';

const SvgEditLine = (props: React.SVGProps<SVGSVGElement>): JSX.Element => (
    <svg
        viewBox='1 1 22 22'
        width='1em'
        height='1em'
        aria-hidden='true'
        focusable='false'
        data-tid={props['data-tid'] ?? 'edit-line-icon'}
        className={classNames('icon-svg', props.className)}
    >
        <path d='M21.66 6.15l-3.82-3.82a1 1 0 00-.73-.3 1.07 1.07 0 00-.76.31L2.46 16.24a1.27 1.27 0 00-.37.86v3.66A1.18 1.18 0 003.23 22h3.62a1.23 1.23 0 00.86-.37L21.64 7.64a1 1 0 00.02-1.49zM6.53 19.92L4.05 20v-2.52l9.55-9.56 2.47 2.47zM17.71 8.75l-2.47-2.47 1.86-1.86 2.47 2.47z' />
    </svg>
);

export default SvgEditLine;
