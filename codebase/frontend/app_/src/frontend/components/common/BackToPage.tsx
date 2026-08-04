import * as React from 'react';

import IconChevronLeft from 'frontend/components/icons/ChevronLeft';

export interface IBackToPageProps {
    onClick: () => void;
    text: string;
}

export const BackToPage = (props: IBackToPageProps) => (
    <div className='search-nav search-nav--py'>
        <a
            className='search-nav__link'
            href=''
            onClick={e => {
                e.preventDefault();
                props.onClick();
            }}
        >
            <IconChevronLeft />
            {props.text}
        </a>
    </div>
);

export default BackToPage;
