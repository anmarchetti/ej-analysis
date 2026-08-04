import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';

import { createMockStores } from 'frontend/__mocks__';
import { mockSitecoreField, mockSitecoreImageField } from 'frontend/utils/tests.utils';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import ChangeFeeInfoMobile from './ChangeFeeInfoMobile';

expect.extend(toHaveNoViolations);

const createMockProps = () => ({
    fields: {
        Title: mockSitecoreField('Test Title'),
        Icon: mockSitecoreField(mockSitecoreImageField('icon.png')),
    },
    descriptionText: 'Test description',
});

let mockStores;
let mockProps;

const mockExpandableItem = jest.fn();
jest.mock('frontend/components/common/ExpandableItem/ExpandableItem', () => props => {
    mockExpandableItem(props);

    return (
        <div>
            <div data-tid='expandable-item' onClick={() => props.onOpen(!props.isOpened)} ref={props.containerRef}>
                {props.title}
            </div>
            {props.children}
        </div>
    );
});

jest.mock('frontend/components/common/JSSImageNext/JSSImageNext', () => () => <img alt='icon' />);

const mockRichTextProps = jest.fn();
jest.mock('@sitecore-jss/sitecore-jss-react', () => ({
    __esModule: true,
    RichText: ({ field, ...props }) => {
        mockRichTextProps(props);

        return <div data-tid='rich-text'>{field.value}</div>;
    },
}));

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockObserverCallback = jest.fn();
const mockObserver = jest.fn(callback => {
    mockObserverCallback.mockImplementation(callback);

    return {
        observe: jest.fn(),
        unobserve: jest.fn(),
    };
});

describe('ChangeFeeInfoMobile', () => {
    beforeEach(() => {
        mockProps = createMockProps();
        mockStores = createMockStores({
            amendHotelStore: {
                filters: {
                    areFiltersSelected: false,
                },
            },
        });
        window.IntersectionObserver = mockObserver as any;
    });

    it('renders correctly with all props', () => {
        render(<ChangeFeeInfoMobile {...mockProps} />);

        expect(screen.getByTestId('change-fee-info-container-mobile')).toHaveClass('container fee-banner-mobile');
        expect(mockExpandableItem).toHaveBeenCalledWith(
            expect.objectContaining({
                className: 'expandableItem expandableItemContainer',
                contentClassName: 'expandableContent',
                expandArrowClassName: 'expandableArrow',
                icon: expect.anything(),
                iconClassName: 'expandableIcon',
                isOpened: false,
                onOpen: expect.any(Function),
                title: 'Test Title',
                titleWrapperClassName: 'expandableTitle',
            }),
        );

        expect(screen.getByText('Test description')).toBeInTheDocument();
        expect(mockRichTextProps).toHaveBeenCalledWith({
            tag: 'span',
            className: 'content',
        });
    });

    it('becomes sticky when intersection observer triggers', async () => {
        await act(async () => {
            render(<ChangeFeeInfoMobile {...mockProps} />);
        });

        const containerRef = screen.getByTestId('change-fee-info-container-mobile');

        expect(containerRef).not.toHaveClass('stuck');

        await act(async () => {
            mockObserverCallback([
                {
                    boundingClientRect: { top: 0 },
                    intersectionRatio: 0.5,
                },
            ]);
        });

        expect(containerRef).toHaveClass('stuck');

        await act(async () => {
            mockObserverCallback([
                {
                    boundingClientRect: { top: -1 },
                    intersectionRatio: 0.5,
                },
            ]);
        });

        expect(containerRef).toHaveClass('stuck');
    });

    it('NOT becomes sticky when it not needed', async () => {
        await act(async () => {
            render(<ChangeFeeInfoMobile {...mockProps} />);
        });

        const containerRef = screen.getByTestId('change-fee-info-container-mobile');

        expect(containerRef).not.toHaveClass('stuck');

        await act(async () => {
            mockObserverCallback([
                {
                    boundingClientRect: { top: 90 },
                    intersectionRatio: 0.5,
                },
            ]);
        });

        expect(containerRef).not.toHaveClass('stuck');

        await act(async () => {
            mockObserverCallback([
                {
                    boundingClientRect: { top: 0 },
                    intersectionRatio: 1,
                },
            ]);
        });

        expect(containerRef).not.toHaveClass('stuck');
    });

    it('should have stuck props', async () => {
        await act(async () => {
            render(<ChangeFeeInfoMobile {...mockProps} />);
        });

        await act(async () => {
            mockObserverCallback([
                {
                    boundingClientRect: { top: 0 },
                    intersectionRatio: 0.5,
                },
            ]);
        });

        const containerRef = screen.getByTestId('change-fee-info-container-mobile');

        expect(containerRef).toHaveClass('stuck');
        expect(screen.getByText(SitecoreDictionary.GlobalsButtonsClose)).toBeInTheDocument();
    });

    it('should expand on click', async () => {
        await act(async () => {
            render(<ChangeFeeInfoMobile {...mockProps} />);
        });

        await act(async () => {
            mockObserverCallback([
                {
                    boundingClientRect: { top: 0 },
                    intersectionRatio: 0.5,
                },
            ]);
        });

        const containerRef = screen.getByTestId('change-fee-info-container-mobile');

        expect(containerRef).toHaveClass('stuck');
        expect(containerRef).not.toHaveClass('hasBackgroud');
        expect(screen.getByText(SitecoreDictionary.GlobalsButtonsClose)).toBeInTheDocument();
        expect(mockExpandableItem).toHaveBeenCalledWith(
            expect.objectContaining({
                isOpened: false,
            }),
        );

        fireEvent.click(screen.getByTestId('expandable-item'));

        expect(mockExpandableItem).toHaveBeenCalledWith(
            expect.objectContaining({
                isOpened: true,
            }),
        );

        expect(containerRef).toHaveClass('hasBackgroud');

        fireEvent.click(screen.getByTestId('change-fee-info-close-mobile'));

        expect(mockExpandableItem).toHaveBeenCalledWith(
            expect.objectContaining({
                isOpened: false,
            }),
        );
        expect(containerRef).not.toHaveClass('hasBackgroud');
    });

    it('Should set body overflow as hidden when banner is stuck and expanded', async () => {
        render(<ChangeFeeInfoMobile {...mockProps} />);

        await act(async () => {
            mockObserverCallback([
                {
                    boundingClientRect: { top: 0 },
                    intersectionRatio: 0.5,
                },
            ]);
        });

        await userEvent.click(screen.getByTestId('expandable-item'));

        expect(document.body).toHaveStyle('overflow: hidden');
    });

    it('Should not set body overflow as hidden when banner is not stuck', async () => {
        render(<ChangeFeeInfoMobile {...mockProps} />);

        await userEvent.click(screen.getByTestId('expandable-item'));

        expect(document.body).not.toHaveStyle('overflow: hidden');
    });

    it('Should not set body overflow as hidden when banner is stuck but not expanded', async () => {
        render(<ChangeFeeInfoMobile {...mockProps} />);

        await act(async () => {
            mockObserverCallback([
                {
                    boundingClientRect: { top: 0 },
                    intersectionRatio: 0.5,
                },
            ]);
        });

        expect(document.body).not.toHaveStyle('overflow: hidden');
    });

    it('Should reset body overflow on unmount', async () => {
        const { unmount } = render(<ChangeFeeInfoMobile {...mockProps} />);

        await act(async () => {
            mockObserverCallback([
                {
                    boundingClientRect: { top: 0 },
                    intersectionRatio: 0.5,
                },
            ]);
        });

        await userEvent.click(screen.getByTestId('expandable-item'));

        unmount();

        expect(document.body).not.toHaveStyle('overflow: hidden');
    });

    it('Should close banner when clicked outside of when isStuck', async () => {
        render(<ChangeFeeInfoMobile {...mockProps} />);

        await act(async () => {
            mockObserverCallback([
                {
                    boundingClientRect: { top: 0 },
                    intersectionRatio: 0.5,
                },
            ]);
        });

        await userEvent.click(screen.getByTestId('expandable-item'));

        const containerRef = screen.getByTestId('change-fee-info-container-mobile');

        expect(containerRef).toHaveClass('hasBackgroud');

        await userEvent.click(screen.getByTestId('change-fee-info-container-mobile'));

        expect(containerRef).not.toHaveClass('hasBackgroud');
        expect(mockExpandableItem).toHaveBeenLastCalledWith(
            expect.objectContaining({
                isOpened: false,
            }),
        );
    });

    it('Should NOT close banner when clicked outside of when isStuck is false', async () => {
        render(<ChangeFeeInfoMobile {...mockProps} />);

        await userEvent.click(screen.getByTestId('expandable-item'));

        expect(screen.getByTestId('expandable-item')).toBeInTheDocument();

        await userEvent.click(document.body);

        expect(mockExpandableItem).toHaveBeenLastCalledWith(
            expect.objectContaining({
                isOpened: true,
            }),
        );
    });

    it('Should render null if no fields', () => {
        mockProps.fields = null;

        render(<ChangeFeeInfoMobile {...mockProps} />);

        expect(screen.queryByTestId('change-fee-info-container-mobile')).not.toBeInTheDocument();
    });

    it('Should lock drawer scroll when banner is inside a drawer', async () => {
        render(
            <div className='drawer drawer--open' data-tid='drawer'>
                <ChangeFeeInfoMobile {...mockProps} />
            </div>,
        );

        await act(async () => {
            mockObserverCallback([
                {
                    boundingClientRect: { top: 0 },
                    intersectionRatio: 0.5,
                },
            ]);
        });

        await userEvent.click(screen.getByTestId('expandable-item'));

        expect(document.body).toHaveStyle('overflow: hidden');
        expect(screen.getByTestId('drawer')).toHaveStyle('overflow: hidden');
    });

    it('Should remove lock from drawer scroll on unmount', async () => {
        const { unmount } = render(
            <div className='drawer drawer--open' data-tid='drawer'>
                <ChangeFeeInfoMobile {...mockProps} />
            </div>,
        );

        await act(async () => {
            mockObserverCallback([
                {
                    boundingClientRect: { top: 0 },
                    intersectionRatio: 0.5,
                },
            ]);
        });

        await userEvent.click(screen.getByTestId('expandable-item'));

        unmount();

        expect(document.body).not.toHaveStyle('overflow: hidden');
        expect(screen.queryByTestId('drawer')).not.toBeInTheDocument();
    });

    it('should add class shouldStickUnderFilters if isAmendHotelPage and areFiltersSelected', async () => {
        mockStores.amendHotelStore.filters.areFiltersSelected = true;
        mockStores.layoutStore.isAmendHotelPage = true;

        await act(async () => {
            render(<ChangeFeeInfoMobile {...mockProps} />);
        });

        await act(async () => {
            mockObserverCallback([
                {
                    boundingClientRect: { top: 48 },
                    intersectionRatio: 0.5,
                },
            ]);
        });

        const containerRef = screen.getByTestId('change-fee-info-container-mobile');

        expect(containerRef).toHaveClass('shouldStickUnderFilters');
    });

    describe('Accessibility', () => {
        it('should pass accessibility', async () => {
            const { container } = render(<ChangeFeeInfoMobile {...mockProps} />);
            const results = await axe(container);

            expect(results).toHaveNoViolations();
        });
    });
});
