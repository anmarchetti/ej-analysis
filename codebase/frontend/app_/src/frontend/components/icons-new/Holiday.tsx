import * as React from 'react';
import classNames from 'classnames';

const SvgHoliday = (props: React.SVGProps<SVGSVGElement>): JSX.Element => (
    <svg
        viewBox='1 1 22 22'
        width='1em'
        height='1em'
        aria-hidden='true'
        focusable='false'
        data-tid={props['data-tid'] ?? 'holiday-icon'}
        className={classNames('icon-svg', props.className)}
    >
        <path d='M9.36 5.29a1.65 1.65 0 10-1.65-1.64 1.64 1.64 0 001.65 1.64zm4.84 6.03h1.14a.78.78 0 00-.33-.45l-1.63-1V7.73a1.88 1.88 0 00-1.88-1.87H7.22a1.89 1.89 0 00-1.88 1.83v5.83a.79.79 0 00.79.8.79.79 0 00.79-.79V7.7a.16.16 0 01.15-.16.16.16 0 01.16.16v13.35a1 1 0 001.9 0v-7.62h.41v7.62a1 1 0 001.91 0V7.7a.17.17 0 01.17-.16.15.15 0 01.16.16v2.57a.77.77 0 00.37.66l1.27.81a.93.93 0 01.78-.42z' />
        <path d='M17.86 14.92h-.24v-2.16a1 1 0 00-1-1h-2.14a1 1 0 00-1 1v2.16h-.26a.83.83 0 00-.83.83v4.59a.82.82 0 00.64.79.49.49 0 101 0H17a.49.49 0 101 0 .82.82 0 00.71-.81v-4.57a.83.83 0 00-.85-.83zm-3.36-2.14h2.13v2.13H14.5zm3.21 3.12v1.8h-4.29v-1.8z' />
    </svg>
);

export default SvgHoliday;
