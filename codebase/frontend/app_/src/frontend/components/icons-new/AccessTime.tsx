import React from 'react';
import classNames from 'classnames';

const SvgAccessTime = (props: React.SVGProps<SVGSVGElement>): JSX.Element => (
    <svg
        xmlns='http://www.w3.org/2000/svg'
        width='20'
        height='20'
        viewBox='0 0 20 20'
        fill='currentColor'
        aria-hidden='true'
        focusable='false'
        data-tid={props['data-tid'] ?? 'access-time-icon'}
        className={classNames('icon-svg', props.className)}
    >
        <path d='M9.992 1.667c4.608 0 8.341 3.733 8.341 8.333s-3.733 8.333-8.341 8.333c-4.6 0-8.325-3.733-8.325-8.333s3.725-8.333 8.325-8.333zm-.175 4.166h-.05c-.334 0-.6.267-.6.6v3.934c0 .291.15.566.408.716l3.458 2.075c.284.167.65.084.817-.2a.592.592 0 0 0-.208-.825l-3.225-1.916V6.433c0-.333-.267-.6-.6-.6z' />
    </svg>
);

export default SvgAccessTime;
