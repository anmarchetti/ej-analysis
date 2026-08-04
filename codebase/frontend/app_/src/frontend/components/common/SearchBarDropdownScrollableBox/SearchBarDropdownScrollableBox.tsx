import { forwardRef } from 'react';
import classNames from 'classnames';

import styles from './SearchBarDropdownScrollableBox.module.scss';

export interface ISearchBarDropdownScrollableBoxProps {
    children?: any;
    className?: string;
}

export const SearchBarDropdownScrollableBox = forwardRef<HTMLDivElement, ISearchBarDropdownScrollableBoxProps>(
    (props, ref) => {
        const { className, children } = props;

        return (
            <div className={classNames(styles.scrollable, className)} data-tid='search-bar-scrollable' ref={ref}>
                {children}
            </div>
        );
    },
);

export default SearchBarDropdownScrollableBox;
