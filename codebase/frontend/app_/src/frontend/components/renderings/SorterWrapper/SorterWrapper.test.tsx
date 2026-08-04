import React from 'react';
import { ComponentRendering } from '@sitecore-jss/sitecore-jss-nextjs';
import { render, screen } from '@testing-library/react';

import { PlaceholderNames } from 'models/enum/PlaceholderNames';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';

import SorterWrapper from './SorterWrapper';

import styles from './SorterWrapper.module.scss';

const createProps = (): ISitecoreComponent => ({
    rendering: {
        componentName: 'Sorter Wrapper',
        placeholders: {
            [PlaceholderNames.SorterWrapperInner]: [
                { uid: 'uid-1', componentName: 'Component-uid-1' },
                { componentName: 'Component-without-uid' },
                { uid: 'uid-2', componentName: 'Component-uid-2' },
            ] as ComponentRendering[],
        },
        params: { EnableOrdering: '1', FriendlyId: 'uk__extras_promocode_ordering' },
    },
    params: {},
    fields: {},
});

const createStoresWithOrder = () => ({
    engageStore: {
        contentOrder: {
            placeholders: {
                'sorter-wrapper-inner': [{ uid: 'uid-2' }, { uid: 'uid-1' }],
            },
        },
        setEngageParams: jest.fn(),
    },
});

const createStoresWithoutOrder = () => ({
    engageStore: {
        contentOrder: {
            placeholders: {
                'sorter-wrapper-inner': [],
            },
        },
        setEngageParams: jest.fn(),
    },
});

jest.mock('react', () => {
    const originalReact = jest.requireActual('react');

    return {
        ...originalReact,
        useContext: jest.fn(),
    };
});

let mockProps;

describe('<SorterWrapper />', () => {
    const mockedUseContext = React.useContext as jest.Mock;

    beforeEach(() => {
        mockProps = createProps();
    });

    it('should render components in the order defined by contentOrder and uses wrapper with gap', () => {
        const mockStores = createStoresWithOrder();
        mockedUseContext.mockReturnValue(mockStores);

        render(<SorterWrapper {...mockProps} />);

        const components = screen.getAllByText(/Component-/);
        expect(components[0]).toHaveTextContent('Component-uid-2');
        expect(components[1]).toHaveTextContent('Component-uid-1');
        expect(screen.queryByText('Component-without-uid')).not.toBeInTheDocument();
        expect(components[0].closest(`.${styles.sorterWrapper}`)).toBeInTheDocument();
        expect(mockStores.engageStore.setEngageParams).toHaveBeenCalledWith(mockProps.rendering.params);
    });

    it('should render components in original order when contentOrder is empty and without custom wrapper', () => {
        mockedUseContext.mockReturnValue(createStoresWithoutOrder());

        render(<SorterWrapper {...mockProps} />);

        const components = screen.getAllByText(/Component-/);
        expect(components[0]).toHaveTextContent('Component-uid-1');
        expect(components[1]).toHaveTextContent('Component-without-uid');
        expect(components[2]).toHaveTextContent('Component-uid-2');

        const wrapper = screen.queryByTestId('ordered-wrapper');
        expect(wrapper).not.toBeInTheDocument();
    });
});
