import React, { forwardRef } from 'react';
import classNames from 'classnames';

import RichTextDictionary from 'frontend/components/common/RichTextDictionary';

export interface ISearchBarInputCalloutProps {
    text: string;
    title: string;
    className?: string;
    icon?: JSX.Element;
    id?: string;
    onClick?: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
}

export const SearchBarInputCallout = forwardRef(
    ({ title, text, icon, className, id, onClick }: ISearchBarInputCalloutProps, ref: React.Ref<HTMLButtonElement>) => (
        <button className={classNames('sb-input-callout', className)} tabIndex={0} ref={ref} onClick={onClick} id={id}>
            {icon}
            <div>
                <div className='sb-input-callout__title'>{title}</div>
                <RichTextDictionary content={text} tag='div' />
            </div>
        </button>
    ),
);

export default SearchBarInputCallout;
