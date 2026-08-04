import * as React from 'react';
import classNames from 'classnames';

const SvgParking = (props: React.SVGProps<SVGSVGElement>): JSX.Element => (
    <svg
        {...props}
        viewBox='1 1 22 22'
        width='1em'
        height='1em'
        aria-hidden='true'
        focusable='false'
        data-tid={props['data-tid'] ?? 'parking-icon'}
        className={classNames('icon-svg', props.className)}
    >
        <path d='M20.46 2H3.54A1.54 1.54 0 002 3.54v16.92A1.54 1.54 0 003.54 22h16.92A1.54 1.54 0 0022 20.46V3.54A1.54 1.54 0 0020.46 2zM20 20H4V4h16z' />
        <path d='M18 6H6v12h12zm-2.63 6a2.63 2.63 0 01-1.49 1.53 3.16 3.16 0 01-1.22.23h-1.82c-.11 0-.16.05-.16.17v1.7a.81.81 0 01-.07.35.8.8 0 01-.18.27.83.83 0 01-.27.17.94.94 0 01-.66 0 1 1 0 01-.27-.17.8.8 0 01-.18-.25.81.81 0 01-.05-.37v-6.7a.77.77 0 01.07-.34.64.64 0 01.18-.27.8.8 0 01.27-.18.88.88 0 01.33-.06h2.85a3.66 3.66 0 011.24.2 2.48 2.48 0 01.89.57 2.23 2.23 0 01.55.88 3.17 3.17 0 01.19 1.14 3.24 3.24 0 01-.2 1.13z' />
        <path d='M12.64 9.58h-1.8c-.11 0-.16.05-.16.17v2.35c0 .11.05.17.16.17h1.8a1.42 1.42 0 00.52-.1 1 1 0 00.38-.29 1.11 1.11 0 00.24-.44 2 2 0 00.08-.57 1.31 1.31 0 00-.32-1 1.22 1.22 0 00-.9-.29z' />
    </svg>
);

export default SvgParking;
