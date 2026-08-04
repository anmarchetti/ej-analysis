import * as React from 'react';
import classNames from 'classnames';

const SvgAdultsOnlyLined = (props: React.SVGProps<SVGSVGElement>): JSX.Element => (
    <svg
        viewBox='1 1 22 22'
        width='1em'
        height='1em'
        aria-hidden='true'
        focusable='false'
        data-tid={props['data-tid'] ?? 'adults-only-lined-icon'}
        className={classNames('icon-svg', props.className)}
    >
        <path d='M19.71 18.82h-.17l-1 .18-.54-3.08a3.7 3.7 0 002-4.34L17.28 2l-5.36 1 .79 9.93A3.7 3.7 0 0016 16.27l.54 3.08-1 .18a1 1 0 00.17 2H16l2-.35 1-.17 1-.18a1 1 0 00-.17-2zM15.84 4.28l1.39 4.93c-.29.12-.6.2-.7.09a2.33 2.33 0 00-2.15-.64l-.32-4.06zm-1.14 8.44l-.16-2.05a.53.53 0 01.56 0 2.15 2.15 0 001.58.66 3.41 3.41 0 001.1-.21l.27 1a1.71 1.71 0 01-1.35 2.15h-.3a1.72 1.72 0 01-1.7-1.55z' />
        <path d='M4 12.1a3.72 3.72 0 002 4.32l-.53 3.09-1-.17H4.3a1 1 0 00-.17 2l3.93.66h.17a1 1 0 00.17-2l-1-.17.6-3.08a3.69 3.69 0 003.31-3.41L12 3.41l-5.4-.92zm3.59 2.69h-.3A1.72 1.72 0 016.12 14a1.7 1.7 0 01-.21-1.37l.5-1.83c.16-.09.62-.32.84-.1a2.12 2.12 0 001.58.66 2.78 2.78 0 00.57-.07l-.13 1.91a1.71 1.71 0 01-1.7 1.59zm2.24-9.72l-.28 4.07c-.33.16-.75.29-.88.16A2.24 2.24 0 007 8.62l1.05-3.85z' />
    </svg>
);

export default SvgAdultsOnlyLined;
