import React from 'react';
import { render, screen } from '@testing-library/react';

import { mockedPoster } from 'frontend/__mocks__';
import { mockSitecoreField } from 'frontend/utils/tests.utils';

import { IPosterContentProps, PosterContent } from './PosterContent';

const createPoster = () => ({ ...mockedPoster });

const mockPlaceholderComponent = jest.fn();

jest.mock('@sitecore-jss/sitecore-jss-nextjs', () => ({
    __esModule: true,
    Placeholder: props => {
        mockPlaceholderComponent(props);

        return <div data-tid='placeholder'>Placeholder</div>;
    },
    Text: ({ field, ...props }) => <div data-tid={`${props['data-tid']}`}>{field.value}</div>,
}));

jest.mock('frontend/components/common/Tooltip', () => ({
    __esModule: true,
    Tooltip: ({ children }) => <div data-tid='tooltip'>{children}</div>,
    TooltipTrigger: ({ children }) => <div data-tid='tooltip-trigger'>{children}</div>,
    TooltipContent: ({ children }) => <div data-tid='tooltip-content'>{children}</div>,
}));

const mockPosterErrorComponent = jest.fn();
const mockPosterTriggerComponent = jest.fn();
const mockPosterContentComponent = jest.fn();

jest.mock('frontend/components/common/Poster', () => ({
    __esModule: true,
    Trigger: ({ children, ...props }) => {
        mockPosterTriggerComponent(props);

        return <div data-tid='poster-trigger'>{children}</div>;
    },
    Error: ({ children, ...props }) => {
        mockPosterErrorComponent(props);

        return <div data-tid='poster-error'>{children}</div>;
    },
    Content: ({ children, ...props }) => {
        mockPosterContentComponent(props);

        return <div data-tid='poster-content'>{children}</div>;
    },
}));

const createStores = () => ({
    layoutStore: { getPhrase: jest.fn() },
    bookingStore: { hotel: { name: 'hotel name' } },
});

let mockStores = createStores();
let mockPoster = createPoster();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => ({ ...mockStores, ...mockPoster }),
}));

describe('<PosterContent />', () => {
    const resetMocks = (): IPosterContentProps => ({
        fields: { ExportPromoLabel: mockSitecoreField('export label') },
        rendering: { componentName: 'PosterContent' },
    });
    let mocks = resetMocks();

    beforeEach(() => {
        mocks = resetMocks();
        mockStores = createStores();
        mockPoster = createPoster();
    });

    it('should not render when no fields', () => {
        mocks.fields = null as any;
        const { container } = render(<PosterContent {...mocks} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should not render when no hotel name', () => {
        mockStores.bookingStore.hotel = { name: undefined } as any;
        const { container } = render(<PosterContent {...mocks} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should not render when no ExportPromoLabel', () => {
        mocks.fields = { ExportPromoLabel: undefined } as any;
        const { container } = render(<PosterContent {...mocks} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should render content', () => {
        render(<PosterContent {...mocks} />);

        expect(screen.getByTestId('hotel-poster')).toBeInTheDocument();
    });

    it('should not render tooltip when no ExportPromoTooltip', () => {
        mocks.fields = {
            ExportPromoLabel: mockSitecoreField('label'),
            ExportPromoTooltip: undefined,
        };
        render(<PosterContent {...mocks} />);

        expect(screen.queryByTestId('tooltip')).not.toBeInTheDocument();
    });

    it('should render tooltip when ExportPromoTooltip', () => {
        mocks.fields = {
            ExportPromoLabel: mockSitecoreField('label'),
            ExportPromoTooltip: mockSitecoreField('tooltip'),
        };
        render(<PosterContent {...mocks} />);

        expect(screen.getByTestId('tooltip')).toBeInTheDocument();
    });

    it('should render tooltip', () => {
        mocks.fields = {
            ExportPromoLabel: mockSitecoreField('label'),
            ExportPromoTooltip: mockSitecoreField('tooltip'),
        };

        render(<PosterContent {...mocks} />);

        expect(screen.getByTestId('tooltip')).toBeInTheDocument();
        expect(screen.getByTestId('tooltip-trigger')).toBeInTheDocument();
        expect(screen.getByTestId('tooltip-content')).toBeInTheDocument();
    });

    describe('popup content', () => {
        beforeEach(() => {
            mocks.fields = {
                ExportPromoLabel: mockSitecoreField('label'),
            };
        });

        it('should render content correctly', () => {
            mocks.fields = {
                ...mocks.fields,
                Title: mockSitecoreField('item heading'),
                DownloadLabel: mockSitecoreField('DownloadLabel'),
                LogoCheckboxLabel: mockSitecoreField('LogoCheckboxLabel'),
                ShowAgentLogoCheckboxLabel: mockSitecoreField('ShowAgentLogoCheckboxLabel'),
                ReturnLabel: mockSitecoreField('ReturnLabel'),
                HideDownloadButton: mockSitecoreField(false),
                ExportAsImage: mockSitecoreField(false),
            };
            render(<PosterContent {...mocks} />);

            expect(mockPosterContentComponent).toHaveBeenCalledWith(
                expect.objectContaining({
                    DownloadLabel: mocks.fields.DownloadLabel,
                    LogoCheckboxLabel: mocks.fields.LogoCheckboxLabel,
                    ReturnLabel: mocks.fields.ReturnLabel,
                    ShowAgentLogoCheckboxLabel: mocks.fields.ShowAgentLogoCheckboxLabel,
                    hasLargeFormat: false,
                    hideButtons: false,
                    id: 'default',
                    posterName: 'hotel name',
                    type: 0,
                }),
            );
        });

        it('should render trigger correctly', () => {
            render(<PosterContent {...mocks} />);

            expect(mockPosterTriggerComponent).toBeCalledWith({ id: 'default' });
        });

        it('should render error correctly', () => {
            render(<PosterContent {...mocks} />);

            expect(mockPosterErrorComponent).toBeCalled();
        });

        it('should render content with type image', () => {
            mocks.fields = {
                ...mocks.fields,
                ExportAsImage: mockSitecoreField(true),
            };
            render(<PosterContent {...mocks} />);

            expect(mockPosterContentComponent).toBeCalledWith(
                expect.objectContaining({
                    type: 1,
                }),
            );
        });

        it('should not render child Title', () => {
            render(<PosterContent {...mocks} />);

            expect(screen.queryByTestId('poster-title')).not.toBeInTheDocument();
        });

        it('should render child Title', () => {
            mocks.fields = {
                ...mocks.fields,
                Title: mockSitecoreField('item heading'),
            };
            render(<PosterContent {...mocks} />);

            expect(screen.getByTestId('poster-title')).toHaveTextContent(mocks.fields.Title!.value);
        });

        it('should not render child Description', () => {
            render(<PosterContent {...mocks} />);

            expect(screen.queryByTestId('poster-description')).not.toBeInTheDocument();
        });

        it('should render child Description', () => {
            mocks.fields = {
                ...mocks.fields,
                Description: mockSitecoreField('item desc'),
            };
            render(<PosterContent {...mocks} />);

            expect(screen.getByTestId('poster-description')).toHaveTextContent(mocks.fields.Description!.value);
        });
    });
});
