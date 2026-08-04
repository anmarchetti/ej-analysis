import * as React from 'react';
import classNames from 'classnames';

const SvgExtrasFilled = (props: React.SVGProps<SVGSVGElement>): JSX.Element => (
    <svg
        viewBox='1 1 22 22'
        width='1em'
        height='1em'
        aria-hidden='true'
        focusable='false'
        data-tid={props['data-tid'] ?? 'extras-filled-icon'}
        className={classNames('icon-svg', props.className)}
    >
        <path d='M12 2a10 10 0 1010 10A10 10 0 0012 2zm5 10a.5.5 0 01-.5.5h-4v4a.5.5 0 01-.5.5.5.5 0 01-.5-.5v-4h-4A.5.5 0 017 12a.5.5 0 01.5-.5h4v-4A.5.5 0 0112 7a.5.5 0 01.5.5v4h4a.5.5 0 01.5.5z' />
    </svg>
);

export default SvgExtrasFilled;
