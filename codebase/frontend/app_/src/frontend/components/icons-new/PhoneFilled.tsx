import * as React from 'react';
import classNames from 'classnames';

const SvgPhoneFilled = (props: React.SVGProps<SVGSVGElement>): JSX.Element => (
    <svg
        viewBox='1 1 22 22'
        width='1em'
        height='1em'
        aria-hidden='true'
        focusable='false'
        data-tid={props['data-tid'] ?? 'phone-filled-icon'}
        className={classNames('icon-svg', props.className)}
    >
        <path d='M18.82 14.51a1.55 1.55 0 00-2.34 0l-1.64 1.64a.32.32 0 01-.45.08c-.35-.19-.73-.35-1.07-.56a16.94 16.94 0 01-4.1-3.73 10 10 0 01-1.47-2.35.33.33 0 01.09-.43c.54-.53 1.08-1.08 1.62-1.62a1.55 1.55 0 000-2.4L8.17 3.85 6.84 2.53a1.55 1.55 0 00-2.34 0c-.5.55-1.08 1.1-1.64 1.64A2.59 2.59 0 002 6a7.52 7.52 0 00.59 3.28 19.94 19.94 0 003.54 5.9 21.9 21.9 0 007.25 5.67 10.48 10.48 0 004 1.17A2.93 2.93 0 0020 21c.47-.53 1-1 1.49-1.51a1.56 1.56 0 000-2.38z' />
    </svg>
);

export default SvgPhoneFilled;
