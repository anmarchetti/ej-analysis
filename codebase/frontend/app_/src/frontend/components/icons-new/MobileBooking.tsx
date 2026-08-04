import * as React from 'react';
import classNames from 'classnames';

const SvgMobileBooking = (props: React.SVGProps<SVGSVGElement>): JSX.Element => (
    <svg
        viewBox='1 1 22 22'
        width='1em'
        height='1em'
        aria-hidden='true'
        focusable='false'
        data-tid={props['data-tid'] ?? 'mobile-booking-icon'}
        className={classNames('icon-svg', props.className)}
    >
        <path d='M16.46 2H7.54A1.5 1.5 0 006 3.46v17.08A1.5 1.5 0 007.54 22h8.92A1.5 1.5 0 0018 20.54V3.46A1.5 1.5 0 0016.46 2zM10 3h4a.5.5 0 01.5.5.5.5 0 01-.5.5h-4a.5.5 0 01-.5-.5.5.5 0 01.5-.5zm2 18a1 1 0 111-1 1 1 0 01-1 1zm4-3H8V5h8z' />
        <path d='M11.72 11.77H9v2.73h2.73zM11.17 14H9.54v-1.68h1.63z' />
        <path d='M10.08 12.86h.55v.55h-.55zm3.27 1.09h.55v.55h-.55zm1.1 0H15v.55h-.55z' />
        <path d='M12.81 12.86h.55v.55h1.63v-1.64h-.54v.55h-.55v-.55h-1.64v2.73h.55v-1.64zM11.72 8.5H9v2.73h2.73zm-.55 2.18H9.54V9.05h1.63z' />
        <path d='M10.08 9.59h.55v.55h-.55zM15 8.5h-2.74v2.73H15zm-.54 2.18h-1.65V9.05h1.64z' />
        <path d='M13.35 9.59h.55v.55h-.55z' />
    </svg>
);

export default SvgMobileBooking;
