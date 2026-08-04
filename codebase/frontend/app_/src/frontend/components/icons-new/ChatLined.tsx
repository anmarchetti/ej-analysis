import * as React from 'react';
import classNames from 'classnames';

const SvgChatLined = (props: React.SVGProps<SVGSVGElement>): JSX.Element => (
    <svg
        viewBox='1 1 22 22'
        width='1em'
        height='1em'
        aria-hidden='true'
        focusable='false'
        data-tid={props['data-tid'] ?? 'chat-lined-icon'}
        className={classNames('icon-svg', props.className)}
    >
        <path d='M6.43 7.76H12a.44.44 0 000-.87H6.43a.44.44 0 000 .87zm11.14 1.7H6.43A.44.44 0 006 9.9a.43.43 0 00.43.43h11.14A.43.43 0 0018 9.9a.44.44 0 00-.43-.44zm0 2.54H6.43a.44.44 0 000 .88h11.14a.44.44 0 000-.88z' />
        <path d='M19.31 2.75H4.69A2.69 2.69 0 002 5.47v9.06a2.68 2.68 0 002.68 2.68h2.46v3a1 1 0 00.64.93.92.92 0 00.36.07 1 1 0 00.74-.33l3.37-3.71h7.06A2.69 2.69 0 0022 14.5V5.44a2.69 2.69 0 00-2.69-2.69zM20 14.5a.68.68 0 01-.69.68h-7.32a1.45 1.45 0 00-1.05.47l-1.8 2v-1a1.43 1.43 0 00-1.43-1.43h-3a.68.68 0 01-.71-.69V5.47a.69.69 0 01.69-.69h14.63a.69.69 0 01.68.69z' />
    </svg>
);

export default SvgChatLined;
