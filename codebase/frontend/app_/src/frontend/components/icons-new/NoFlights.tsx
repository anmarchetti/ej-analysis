import * as React from 'react';
import classNames from 'classnames';

const SvgNoFlights = (props: React.SVGProps<SVGSVGElement>): JSX.Element => (
    <svg
        viewBox='1 1 22 22'
        width='1em'
        height='1em'
        aria-hidden='true'
        focusable='false'
        data-tid={props['data-tid'] ?? 'no-flights-icon'}
        className={classNames('icon-svg', props.className)}
    >
        <path d='M16.37 10l4-4A1.68 1.68 0 0018 3.58l-4 4-6.34-2.06 10.8 10.81zm5.13 10.8L18.7 18 6 5.28 3.2 2.5a.48.48 0 00-.7 0 .48.48 0 000 .7L5.27 6 5 6.28a.67.67 0 00.12 1l4 2.47 1.36 1.36L7 14.6l-1.72-.29a.56.56 0 00-.49.16l-.79.84a.56.56 0 00.21.92l2.41.84a.55.55 0 01.34.34l.84 2.4a.56.56 0 00.92.21l.84-.84a.55.55 0 00.15-.48L9.39 17l3.44-3.44 1.36 1.36 2.47 4a.66.66 0 001 .12l.31-.31 2.83 2.77a.49.49 0 00.7-.7z' />
    </svg>
);

export default SvgNoFlights;
