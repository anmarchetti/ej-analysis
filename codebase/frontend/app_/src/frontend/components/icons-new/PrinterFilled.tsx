import * as React from 'react';
import classNames from 'classnames';

const SvgPrinterFilled = (props: React.SVGProps<SVGSVGElement>): JSX.Element => (
    <svg
        viewBox='1 1 22 22'
        width='1em'
        height='1em'
        aria-hidden='true'
        focusable='false'
        data-tid={props['data-tid'] ?? 'printer-filled-icon'}
        className={classNames('icon-svg', props.className)}
    >
        <path d='M9 15.54h6a.5.5 0 01.5.5.5.5 0 01-.5.5H9a.5.5 0 01-.5-.5.5.5 0 01.5-.5zm0 2.15h6a.5.5 0 01.5.5.5.5 0 01-.5.5H9a.5.5 0 01-.5-.5.5.5 0 01.5-.5z' />
        <path d='M9 18.69h6a.5.5 0 00.5-.5.5.5 0 00-.5-.5H9a.5.5 0 00-.5.5.5.5 0 00.5.5zm0-2.15h6a.5.5 0 00.5-.5.5.5 0 00-.5-.5H9a.5.5 0 00-.5.5.5.5 0 00.5.5z' />
        <path d='M19.48 6.6h-1.42V5.43a2.94 2.94 0 00-2.94-2.93H8.88a2.94 2.94 0 00-2.94 2.93V6.6H4.52A2.45 2.45 0 002 9v6a2.45 2.45 0 002.52 2.39h1.06v2.83a1.29 1.29 0 001.29 1.28h10.22a1.29 1.29 0 001.29-1.29v-2.83h1.1A2.45 2.45 0 0022 15V9a2.45 2.45 0 00-2.52-2.4zm-2.3 3h1a.5.5 0 01.5.5.51.51 0 01-.5.5h-1a.5.5 0 01-.5-.5.5.5 0 01.5-.5zM7.94 5.43a.94.94 0 01.94-.93h6.24a.94.94 0 01.94.93v1.13H7.94zM19 13.74h-1.62v6.47a.29.29 0 01-.29.29H6.87a.29.29 0 01-.29-.29v-6.47H5a.5.5 0 01-.5-.5.5.5 0 01.5-.5h14a.5.5 0 01.5.5.5.5 0 01-.5.5z' />
    </svg>
);

export default SvgPrinterFilled;
