import * as React from 'react';
import classNames from 'classnames';

const SvgLargeLuggageBike = (props: React.SVGProps<SVGSVGElement>): JSX.Element => (
    <svg
        viewBox='1 1 22 22'
        width='1em'
        height='1em'
        aria-hidden='true'
        focusable='false'
        data-tid={props['data-tid'] ?? 'large-luggage-bike-icon'}
        className={classNames('icon-svg', props.className)}
    >
        <path d='M17.81 10a4.1 4.1 0 00-1.45.27l-.68-1.31V6.79a.51.51 0 00-.33-.47l-1.67-.61A.51.51 0 0013 6a.5.5 0 00.3.64l1.34.49v1.43H9.08v-.22h.39a.5.5 0 100-1H7.82a.5.5 0 000 1h.26V9l-.58 1.2a4.05 4.05 0 00-1.31-.2 4.18 4.18 0 104.13 4.67h1.34a.49.49 0 00.41-.21l3-4.41.34.67a4.18 4.18 0 102.4-.72zM6.19 17.32a3.18 3.18 0 010-6.35 3.18 3.18 0 01.88.14l-1.33 2.82a.51.51 0 000 .48.48.48 0 00.42.23h3.16a3.17 3.17 0 01-3.13 2.68zM8 11.52a3.2 3.2 0 011.34 2.12H7zm3.42 2.12h-1.1a4.16 4.16 0 00-1.91-3l.49-1.08h5.32zm6.41 3.68a3.16 3.16 0 01-1.88-5.72l1.43 2.77a.51.51 0 00.45.27.49.49 0 00.44-.73l-1.43-2.77a3.21 3.21 0 011-.17 3.18 3.18 0 010 6.35z' />
    </svg>
);

export default SvgLargeLuggageBike;
