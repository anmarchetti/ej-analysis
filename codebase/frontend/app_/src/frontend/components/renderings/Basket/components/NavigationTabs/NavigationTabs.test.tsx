import React, { RefObject } from 'react';
import { render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';

import NavigationTabs from './NavigationTabs';
import * as utils from './NavigationTabs.utils';
import { IUseNavigationTabsPreparedData } from './NavigationTabs.utils';

const observe = jest.fn();
const unobserve = jest.fn();
const disconnect = jest.fn();

const mockIntersectionObserver = jest.fn();

mockIntersectionObserver.mockReturnValue({
    observe,
    unobserve,
    disconnect,
});

window.IntersectionObserver = mockIntersectionObserver;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const createProps = () => ({
    list: Array.from({ length: 5 }).map((_, idx) => ({
        fields: {
            Icon: {
                value: {
                    src: '/holidays/cms/media/-/jssmedia/project/holidays/de…1.svg?iar=0&hash=4DB2EE8BA315A8B5A1B3A562FDD6E0F9',
                    alt: '',
                },
            },
            Id: {
                value: `id-${idx}`,
            },
            Name: { value: `name-${idx}` },
        },
        id: `id-${idx}`,
    })),
});

let mockStores;
let props;

const preparedData: IUseNavigationTabsPreparedData = {
    list: createProps().list,
    active: createProps().list[0],
    onClick: jest.fn(),
    onOpen: jest.fn(),
    onClose: jest.fn(),
    isMobileActiveItemDisplayed: false,
    isMobileCollapseItemDisplayed: false,
    isListDisplayed: true,
    wrapperClassNames: 'wrapper',
    linksClassNames: 'links',
    wrapperRef: {} as RefObject<HTMLDivElement>,
};

const useNavigationTabs = jest.spyOn(utils, 'default').mockReturnValue(preparedData);

describe('<NavigationTabs />', () => {
    beforeEach(() => {
        mockStores = createMockStores();
        props = createProps();
    });

    describe('mobile view', () => {
        it('should be collapsed when isMobileActiveItemDisplayed is true', () => {
            useNavigationTabs.mockReturnValueOnce({
                ...preparedData,
                isMobileActiveItemDisplayed: true,
            });

            render(<NavigationTabs {...props} />);

            expect(screen.getByTestId('navigation-tabs-wrapper')).toBeInTheDocument();
            expect(screen.getByTestId('mobile-active-item')).toBeInTheDocument();
            expect(screen.getAllByTestId('navigation-tab')).toHaveLength(props.list.length);
            expect(screen.queryByTestId('mobile-close-item')).not.toBeInTheDocument();
        });

        it('should be expanded when isMobileCollapseItemDisplayed is true', () => {
            useNavigationTabs.mockReturnValueOnce({
                ...preparedData,
                isMobileCollapseItemDisplayed: true,
            });

            render(<NavigationTabs {...props} />);

            expect(screen.queryByTestId('mobile-active-item')).not.toBeInTheDocument();
            expect(screen.getAllByTestId('navigation-tab')).toHaveLength(props.list.length);
            expect(screen.getByTestId('mobile-close-item')).toBeInTheDocument();
        });
    });

    describe('desktop view', () => {
        it('should NOT render both active-item and close-item', () => {
            render(<NavigationTabs {...props} />);

            expect(screen.getByTestId('navigation-tabs-wrapper')).toBeInTheDocument();
            expect(screen.queryByTestId('mobile-active-item')).not.toBeInTheDocument();
            expect(screen.getAllByTestId('navigation-tab')).toHaveLength(props.list.length);
            expect(screen.queryByTestId('mobile-close-item')).not.toBeInTheDocument();
        });
    });
});
