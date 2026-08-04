import * as React from 'react';
import classNames from 'classnames';

const SvgChatFilled = (props: React.SVGProps<SVGSVGElement>): JSX.Element => (
    <svg
        viewBox='1 1 22 22'
        width='1em'
        height='1em'
        aria-hidden='true'
        focusable='false'
        data-tid={props['data-tid'] ?? 'chat-filled-icon'}
        className={classNames('icon-svg', props.className)}
    >
        <path d='M19.31 2.75H4.69A2.7 2.7 0 002 5.47v9.06a2.68 2.68 0 002.68 2.68h2.46v3a1 1 0 00.64.93.92.92 0 00.36.07 1 1 0 00.74-.33l3.37-3.71h7.06A2.69 2.69 0 0022 14.5V5.44a2.69 2.69 0 00-2.69-2.69zM6.43 6.89H12a.44.44 0 010 .87H6.43a.44.44 0 010-.87zm11.14 6H6.43a.44.44 0 010-.88h11.14a.44.44 0 010 .88zm0-2.58H6.43A.43.43 0 016 9.9a.44.44 0 01.43-.44h11.14a.44.44 0 01.43.44.43.43 0 01-.43.43z' />
    </svg>
);

export default SvgChatFilled;
