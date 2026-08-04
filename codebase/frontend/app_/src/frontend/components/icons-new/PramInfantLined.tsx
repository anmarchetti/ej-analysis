import * as React from 'react';
import classNames from 'classnames';

const SvgPramInfantLined = (props: React.SVGProps<SVGSVGElement>): JSX.Element => (
    <svg
        viewBox='1 1 22 22'
        width='1em'
        height='1em'
        aria-hidden='true'
        focusable='false'
        data-tid={props['data-tid'] ?? 'pram-infant-lined-icon'}
        className={classNames('icon-svg', props.className)}
    >
        <path d='M15.4 2h-2.33v6.94H5.75V4.25a1 1 0 00-1-1H3a1 1 0 000 2h.74v7.49a3.47 3.47 0 003.48 3.47h3.43l.8.79-1.08 1.09A1.86 1.86 0 009.8 18a2 2 0 101.71 3h2.72a2 2 0 101.71-3 1.9 1.9 0 00-.53.09L14.29 17l.76-.77h3.47A3.47 3.47 0 0022 12.74V8.6A6.59 6.59 0 0015.4 2zM9.8 20.49a.5.5 0 01-.5-.5.51.51 0 01.5-.5.5.5 0 01.5.5.5.5 0 01-.5.5zM10.89 19zm5 .5a.5.5 0 01.5.5.5.5 0 01-.5.5.5.5 0 01-.5-.5.51.51 0 01.55-.51zm-3.62-.5l.62-.62.63.62zM20 12.74a1.47 1.47 0 01-1.47 1.47H7.23a1.47 1.47 0 01-1.48-1.47v-1.8H20zm0-3.81h-4.93V4h.33A4.6 4.6 0 0120 8.6z' />
    </svg>
);

export default SvgPramInfantLined;
