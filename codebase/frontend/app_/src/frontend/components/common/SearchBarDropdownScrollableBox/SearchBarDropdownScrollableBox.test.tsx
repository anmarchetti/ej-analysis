import React from 'react';
import { render, screen } from '@testing-library/react';

import SearchBarDropdownScrollableBox, { ISearchBarDropdownScrollableBoxProps } from './SearchBarDropdownScrollableBox';

let mocks;

const resetMocks = (): ISearchBarDropdownScrollableBoxProps => ({});

describe('SearchBarDropdownScrollableBox', () => {
    beforeEach(() => {
        mocks = resetMocks();
    });

    it('should render', () => {
        render(<SearchBarDropdownScrollableBox {...mocks} />);

        expect(screen.getByTestId('search-bar-scrollable')).toBeInTheDocument();
    });

    it('should assign ref to container', () => {
        mocks.ref = React.createRef();
        render(<SearchBarDropdownScrollableBox {...mocks} />);

        const scrollableBox = screen.getByTestId('search-bar-scrollable');
        expect(mocks.ref.current).toBe(scrollableBox);
    });
});
