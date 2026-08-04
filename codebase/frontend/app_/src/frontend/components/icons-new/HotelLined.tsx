import * as React from 'react';
import classNames from 'classnames';

const SvgHotelLined = (props: React.SVGProps<SVGSVGElement>): JSX.Element => (
    <svg
        viewBox='1 1 22 22'
        width='1em'
        height='1em'
        aria-hidden='true'
        focusable='false'
        className={classNames('icon-svg', props.className)}
        data-tid={props['data-tid'] ?? 'hotel-lined-icon'}
    >
        <path d='M18.84 4.06h-.94V2.94A1 1 0 0017 2H6.87a.94.94 0 00-.94.94v1.12h-.77A1.19 1.19 0 004 5.26v15.55A1.19 1.19 0 005.16 22h13.68A1.19 1.19 0 0020 20.81V5.26a1.19 1.19 0 00-1.16-1.2zM13.86 20h-.95v-2h.95zm-2.95 0H10v-2h.94zM18 20h-2.14v-3a1 1 0 00-1-1H9a1 1 0 00-1 1v3H6V6.06h12z' />
        <path d='M6.97 7h2v2h-2zm3.94 0h2v2h-2zm3.95 0h2v2h-2zm-7.89 3h2v2h-2zm3.94 0h2v2h-2zm3.95 0h2v2h-2zm-7.89 3h2v2h-2zm3.94 0h2v2h-2zm3.95 0h2v2h-2z' />
    </svg>
);

export default SvgHotelLined;
