import * as React from 'react';
import classNames from 'classnames';

const SvgHelpFilled = (props: React.SVGProps<SVGSVGElement>): JSX.Element => (
    <svg
        viewBox='1 1 22 22'
        width='1em'
        height='1em'
        aria-hidden='true'
        focusable='false'
        data-tid={props['data-tid'] ?? 'help-filled-icon'}
        className={classNames('icon-svg', props.className)}
    >
        <path d='M12 2a10 10 0 1010 10A10 10 0 0012 2zm-.09 15.74a1.1 1.1 0 01-1.09-1.07 1.09 1.09 0 011.09-1.07A1.05 1.05 0 0113 16.67a1.06 1.06 0 01-1.09 1.07zm1.54-5.08c-.48.17-.67.51-.67 1.21a.83.83 0 01-.9.93.83.83 0 01-.9-.93 2.7 2.7 0 011.8-2.87 1.37 1.37 0 001-1.35 1.5 1.5 0 00-1.56-1.4 2.69 2.69 0 00-2.1 1 .94.94 0 01-.72.32.9.9 0 01-.93-.94A1.16 1.16 0 018.69 8a4.63 4.63 0 013.53-1.7 3.41 3.41 0 013.5 3.28 3.25 3.25 0 01-2.27 3.08z' />
    </svg>
);

export default SvgHelpFilled;
