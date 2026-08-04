import * as React from 'react';
import classNames from 'classnames';

const SvgNif = (props: React.SVGProps<SVGSVGElement>): JSX.Element => (
    <svg
        viewBox='1 1 22 22'
        width='1em'
        height='1em'
        aria-hidden='true'
        focusable='false'
        data-tid={props['data-tid'] ?? 'nif-icon'}
        className={classNames('icon-svg', props.className)}
    >
        <path d='M9.65 8.5a.69.69 0 00-.7.71v3.43c0 .15-.15.16-.22.07L5.39 8.77a.74.74 0 00-.57-.27.69.69 0 00-.71.71v5.58a.71.71 0 001.42 0v-3.42c0-.12.12-.17.22-.07l3.34 3.93a.73.73 0 00.56.27.7.7 0 00.72-.71V9.21a.7.7 0 00-.72-.71zm2.93 0a.69.69 0 00-.71.71v5.58a.71.71 0 001.42 0V9.21a.69.69 0 00-.71-.71zm3.75 1.25h2.93a.63.63 0 100-1.25H15.5a.69.69 0 00-.71.71v5.58a.71.71 0 001.42 0v-1.92c0-.09 0-.14.12-.14h2.53a.63.63 0 100-1.25h-2.53c-.08 0-.12-.05-.12-.14V9.89c0-.09.04-.14.12-.14z' />
    </svg>
);

export default SvgNif;
