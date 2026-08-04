import * as React from 'react';
import classNames from 'classnames';

const SvgSki = (props: React.SVGProps<SVGSVGElement>): JSX.Element => (
    <svg
        viewBox='1 1 22 22'
        width='1em'
        height='1em'
        aria-hidden='true'
        focusable='false'
        data-tid={props['data-tid'] ?? 'ski-icon'}
        className={classNames('icon-svg', props.className)}
    >
        <path d='M15.39 5.81a2 2 0 10-1.18-2.52 2 2 0 001.18 2.52zm5.44 11.94a1 1 0 00-1.28.6 2.51 2.51 0 01-3.23 1.5l-1.94-.7L16.07 16a2.27 2.27 0 00-.91-3.08l-1.35-.73a.22.22 0 01-.09-.3l.75-1.38.41.65a1.73 1.73 0 001.47.8 1.65 1.65 0 00.85-.23l2.3-1.3a.88.88 0 10-.87-1.54l-2.27 1.28-1-1.54a1.64 1.64 0 000-.76 1.76 1.76 0 00-3.23-.33l-.13.23-6.77-3.88.48-.84a.5.5 0 00-.86-.5l-.48.84-.91-.53a.51.51 0 00-.68.19.49.49 0 00.22.68l.91.52-.49.84a.5.5 0 00.18.68.51.51 0 00.69-.18l.48-.84 6.75 3.9-.27.5L10 11.33a2.56 2.56 0 00-.2 1.9 2.53 2.53 0 001.2 1.49l1 .53a.41.41 0 01.16.54L11 17.93l-7.14-2.61a1 1 0 10-.69 1.87l12.47 4.54a4.42 4.42 0 003.45-.15A4.51 4.51 0 0021.43 19a1 1 0 00-.6-1.25z' />
    </svg>
);

export default SvgSki;
