import * as React from 'react';
import classNames from 'classnames';

const SvgView = (props: React.SVGProps<SVGSVGElement>): JSX.Element => (
    <svg
        viewBox='1 1 22 22'
        width='1em'
        height='1em'
        aria-hidden='true'
        focusable='false'
        data-tid={props['data-tid'] ?? 'view-icon'}
        className={classNames('icon-svg', props.className)}
    >
        <path d='M11.8 10h.4-.4zM10 12zm4 0zm8.3-.5C19.7 7.9 16 5.7 12 5.7S4.3 7.9 1.7 11.5c-.2.3-.2.7 0 1C4.3 16.1 8 18.3 12 18.3s7.7-2.2 10.3-5.8c.3-.3.3-.7 0-1zm-8.2.5c0 1.2-.9 2.1-2.1 2.1s-2.1-.9-2.1-2.1c0-1.1.8-2 1.9-2.1h.4c1.1.1 1.9 1 1.9 2.1zM4 12c1.8-2.2 4.3-3.7 7.1-4.1-2.3.5-3.7 2.8-3.1 5 .4 1.6 1.7 2.8 3.3 3.2-3-.3-5.6-1.8-7.3-4.1zm8.8 4.1c2.3-.4 3.8-2.6 3.4-4.9-.3-1.6-1.6-2.9-3.2-3.3 2.8.4 5.4 1.9 7.1 4.1-1.8 2.3-4.5 3.8-7.3 4.1z' />
    </svg>
);

export default SvgView;
