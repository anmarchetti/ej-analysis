import * as React from 'react';
import classNames from 'classnames';

const SvgDeleteLined = (props: React.SVGProps<SVGSVGElement>): JSX.Element => (
    <svg
        viewBox='1 1 22 22'
        width='1em'
        height='1em'
        aria-hidden='true'
        focusable='false'
        data-tid={props['data-tid'] ?? 'delete-lined-icon'}
        className={classNames('icon-svg', props.className)}
    >
        <path d='M21 4.69h-4.75V4a1.31 1.31 0 00-1.31-1.3H9.05A1.3 1.3 0 007.75 4v.68H3a1 1 0 000 2h1.5V20a1.31 1.31 0 001.31 1.31h12.38A1.31 1.31 0 0019.5 20V6.69H21a1 1 0 000-2zm-3.5 14.62h-11V6.69h11z' />
        <path d='M12 8a.5.5 0 00-.5.5v9a.5.5 0 001 0v-9A.5.5 0 0012 8zm2.75.49v9a.5.5 0 00.5.5.5.5 0 00.5-.5v-9a.51.51 0 00-.5-.5.5.5 0 00-.5.5zm-6-.49a.5.5 0 00-.5.5v9a.5.5 0 001 0v-9a.5.5 0 00-.5-.5z' />
    </svg>
);

export default SvgDeleteLined;
