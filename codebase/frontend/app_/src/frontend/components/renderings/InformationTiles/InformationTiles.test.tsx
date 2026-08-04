import * as React from 'react';
import { render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import { ContainerPaddingOptions, TextPosition } from 'models/enum/CustomisableComponentsParameters';
import { InformationTilesTheme } from 'models/enum/InformationTilesTheme';

import { IInformationTilesProps, InformationTiles } from './InformationTiles';

import styles from './InformationTiles.module.scss';

const mockCarouselProps = jest.fn();
jest.mock('frontend/components/common/CarouselWrapper/CarouselWrapper', () => ({
    __esModule: true,
    default: props => {
        mockCarouselProps(props);

        return (
            <div className={props.className} data-tid='carousel'>
                {props.children}
            </div>
        );
    },
}));

const mockInformationTilesItemProps = jest.fn();
jest.mock('./components/InformationTilesItem', () => ({
    __esModule: true,
    default: props => {
        mockInformationTilesItemProps(props);

        return <div data-tid='information-tiles-item' />;
    },
}));

let mockUseMobileViewport = false;
let mockUseTabletViewport = false;
jest.mock('frontend/hooks/useMediaQuery', () => ({
    __esModule: true,
    useMobileViewport: () => mockUseMobileViewport,
    useTabletViewport: () => mockUseTabletViewport,
}));

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockStores = createMockStores();
const resetMocks = (): IInformationTilesProps => ({
    fields: {
        Children: [
            {
                id: '1',
                fields: {
                    Icon: {
                        value: {
                            src: 'src',
                        },
                    },
                    Title: {
                        value: 'Title',
                    },
                    Description: {
                        value: 'Description',
                    },
                },
                displayName: '',
                name: '',
            },
        ],
    },
    params: {
        Theme: InformationTilesTheme.GlobalVariant,
    },
    isDefaultTheme: true,
    rendering: {},
});
let mocks;

describe('InformationTiles', () => {
    beforeEach(() => {
        mocks = resetMocks();
        mockUseMobileViewport = false;
        mockUseTabletViewport = false;
    });

    it('Should NOT render when no items', () => {
        mocks.fields = null;
        const { container } = render(<InformationTiles {...mocks} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('Should render standard', () => {
        const { container } = render(<InformationTiles {...mocks} />);

        expect(container.querySelector('.information-tiles')).toBeInTheDocument();
        expect(screen.getByTestId('information-tiles-item')).toBeInTheDocument();
    });

    it('Should render standard when no params', () => {
        mocks.params = null;

        const { container } = render(<InformationTiles {...mocks} />);

        expect(container.querySelector('.information-tiles')).toBeInTheDocument();
        expect(container.querySelector('.information-tiles--page')).not.toBeInTheDocument();
        expect(screen.getByTestId('information-tiles-item')).toBeInTheDocument();
    });

    it('Should page theme render', () => {
        mocks.params.Theme = InformationTilesTheme.PageVariant;

        const { container } = render(<InformationTiles {...mocks} />);

        expect(container.querySelector('.information-tiles--page')).toBeInTheDocument();
        expect(screen.getByTestId('information-tiles-item')).toBeInTheDocument();
    });

    it('Should render center align text ', () => {
        mocks.params.TextAlign = TextPosition.Center;
        const { container } = render(<InformationTiles {...mocks} />);

        expect(container.querySelector('.information-tiles--center')).toBeInTheDocument();
    });

    it('Should render carousel on mobile', () => {
        mockUseMobileViewport = true;

        const { container } = render(<InformationTiles {...mocks} />);

        expect(container.querySelector('.information-tiles--carousel')).toBeInTheDocument();
        expect(container.querySelector('.information--centered')).not.toBeInTheDocument();
        expect(screen.getByTestId('carousel')).toBeInTheDocument();
    });

    it('Should NOT render carousel for Default Theme on desktop', () => {
        const { container } = render(<InformationTiles {...mocks} />);

        expect(container.querySelectorAll('.information--centered').length).toBe(1);
        expect(screen.queryByTestId('carousel')).not.toBeInTheDocument();
    });

    it('Should render carousel for Default Theme when item count is greater than 4', () => {
        mocks.fields.Children = [
            {
                id: '1',
                fields: {
                    Icon: 'Icon',
                    Title: {
                        value: 'Title',
                    },
                    Description: {
                        value: 'Description',
                    },
                },
            },
            {
                id: '2',
                fields: {
                    Icon: 'Icon',
                    Title: {
                        value: 'Title',
                    },
                    Description: {
                        value: 'Description',
                    },
                },
            },
            {
                id: '3',
                fields: {
                    Icon: 'Icon',
                    Title: {
                        value: 'Title',
                    },
                    Description: {
                        value: 'Description',
                    },
                },
            },
            {
                id: '4',
                fields: {
                    Icon: 'Icon',
                    Title: {
                        value: 'Title',
                    },
                    Description: {
                        value: 'Description',
                    },
                },
            },
            {
                id: '5',
                fields: {
                    Icon: 'Icon',
                    Title: {
                        value: 'Title',
                    },
                    Description: {
                        value: 'Description',
                    },
                },
            },
        ];

        const { container } = render(<InformationTiles {...mocks} />);

        expect(container.querySelectorAll('.information--centered').length).toBe(0);
        expect(screen.getByTestId('carousel')).toBeInTheDocument();
    });

    it('Should NOT render carousel for Other Themes', () => {
        mocks.isDefaultTheme = false;

        const { container } = render(<InformationTiles {...mocks} />);

        expect(container.querySelectorAll('.information--centered').length).toBe(0);
        expect(screen.queryByTestId('carousel')).not.toBeInTheDocument();
    });

    describe('Transparent theme', () => {
        const baseTransparentCarouselClassName = `information-tiles information-tiles--carousel ${styles.tilesContainer} information-tiles--transparent`;

        beforeEach(() => {
            mocks.params.Theme = InformationTilesTheme.TransparentCarouselVariant;
            mocks.isDefaultTheme = false;
        });

        it('should render mobile transparent theme', () => {
            mockUseMobileViewport = true;
            render(<InformationTiles {...mocks} />);

            expect(screen.getByTestId('carousel')).toHaveClass('information-tiles--transparent');
            expect(mockCarouselProps).toHaveBeenCalledWith(
                expect.objectContaining({
                    centerMode: false,
                    className: `${baseTransparentCarouselClassName} ${styles.noMargin} ${styles.carouselContainer}`,
                    infinite: true,
                    showDots: true,
                    arrows: false,
                    partialVisible: true,
                }),
            );
        });

        it('should render mobile transparent theme on tablet', () => {
            mockUseTabletViewport = true;

            render(<InformationTiles {...mocks} />);

            expect(screen.getByTestId('carousel')).toHaveClass('information-tiles--transparent');
            expect(mockCarouselProps).toHaveBeenCalledWith(
                expect.objectContaining({
                    centerMode: false,
                    className: `${baseTransparentCarouselClassName} ${styles.noMargin} ${styles.carouselContainer}`,
                    infinite: true,
                    showDots: true,
                    arrows: false,
                    partialVisible: true,
                }),
            );
        });

        it('should NOT apply noMargin style when isUsedAsComponent is true', () => {
            mockUseTabletViewport = true;
            mocks.isUsedAsComponent = true;

            render(<InformationTiles {...mocks} />);

            expect(screen.getByTestId('carousel')).toHaveClass('information-tiles--transparent');
            expect(mockCarouselProps).toHaveBeenCalledWith(
                expect.objectContaining({
                    className: `${baseTransparentCarouselClassName} ${styles.carouselContainer}`,
                }),
            );
        });
    });

    describe('PaddingSize param', () => {
        it('should render wrapper with padding class when PaddingSize is defined', () => {
            mocks.params.PaddingSize = ContainerPaddingOptions.Padding16;
            const { container } = render(<InformationTiles {...mocks} />);

            const wrapper = container.querySelector('.information-tiles')!.parentElement;
            expect(wrapper).toHaveClass('padding-16');
        });

        it('should render wrapper with default padding class when PaddingSize is not defined', () => {
            const { container } = render(<InformationTiles {...mocks} />);

            const wrapper = container.querySelector('.information-tiles')!.parentElement;
            expect(wrapper).toHaveClass('padding-24');
        });

        it('should NOT render wrapper when isUsedAsComponent is true', () => {
            mocks.isUsedAsComponent = true;
            const { container } = render(<InformationTiles {...mocks} />);
            const firstChild = container.firstChild;

            expect(firstChild).toHaveClass('information-tiles');
        });
    });

    describe('shouldRenderOtherThemeCarousel logic', () => {
        it('should render carousel on mobile for other themes', () => {
            mockUseMobileViewport = true;
            mocks.isDefaultTheme = false;

            render(<InformationTiles {...mocks} />);

            expect(screen.getByTestId('carousel')).toBeInTheDocument();
        });

        it('should render carousel on tablet with transparent variant', () => {
            mockUseTabletViewport = true;
            mocks.params.Theme = InformationTilesTheme.TransparentCarouselVariant;
            mocks.isDefaultTheme = false;

            render(<InformationTiles {...mocks} />);

            expect(screen.getByTestId('carousel')).toBeInTheDocument();
        });

        it('should NOT render carousel on tablet without transparent variant', () => {
            mockUseTabletViewport = true;
            mocks.isDefaultTheme = false;

            const { container } = render(<InformationTiles {...mocks} />);

            expect(screen.queryByTestId('carousel')).not.toBeInTheDocument();
            expect(container.querySelector('.information-tiles')).toBeInTheDocument();
        });

        it('should NOT apply carouselContainer class when shouldRenderOtherThemeCarousel is false', () => {
            mocks.isDefaultTheme = false;
            mockUseMobileViewport = false;
            mockUseTabletViewport = false;

            const { container } = render(<InformationTiles {...mocks} />);

            const tilesElement = container.querySelector('.information-tiles');
            expect(tilesElement).toHaveClass(styles.tilesContainer);
            expect(tilesElement).not.toHaveClass(styles.carouselContainer);
        });

        describe('when items length is greater than DESKTOP_ITEMS_AMOUNT', () => {
            beforeEach(() => {
                mocks.fields.Children = new Array(5).fill(null).map((_, i) => ({
                    id: `${i}`,
                    fields: {
                        Icon: 'Icon',
                        Title: { value: 'Title' },
                        Description: { value: 'Description' },
                    },
                }));
            });

            it('should render carousel', () => {
                mocks.isDefaultTheme = false;

                render(<InformationTiles {...mocks} />);

                expect(screen.getByTestId('carousel')).toBeInTheDocument();
            });

            it('should apply carouselContainer class when shouldRenderOtherThemeCarousel is true', () => {
                mocks.isDefaultTheme = false;

                const { container } = render(<InformationTiles {...mocks} />);

                const tilesElement = container.querySelector('.information-tiles');
                expect(tilesElement).toHaveClass(styles.tilesContainer);
                expect(tilesElement).toHaveClass(styles.carouselContainer);
            });
        });
    });

    describe('carouselItem class application', () => {
        beforeEach(() => {
            mocks.fields.Children = new Array(5).fill(null).map((_, i) => ({
                id: `${i}`,
                fields: {
                    Icon: 'Icon',
                    Title: { value: 'Title' },
                    Description: { value: 'Description' },
                },
            }));
        });

        it('should apply carouselItem class with margin when: not isUsedAsComponent, transparent variant, desktop, and shouldRenderOtherThemeCarousel', () => {
            mocks.params.Theme = InformationTilesTheme.TransparentCarouselVariant;
            mocks.isUsedAsComponent = false;
            mocks.isDefaultTheme = false;
            mockUseMobileViewport = false;
            mockUseTabletViewport = false;

            render(<InformationTiles {...mocks} />);

            expect(mockInformationTilesItemProps).toHaveBeenCalledWith(
                expect.objectContaining({
                    className: `${styles.tile} ${styles.carouselItem} ${styles.defaultCarouselItem}`,
                }),
            );
        });

        it('should NOT apply carouselItem class with margin on mobile (isSmallScreen)', () => {
            mocks.params.Theme = InformationTilesTheme.TransparentCarouselVariant;
            mocks.isUsedAsComponent = false;
            mocks.isDefaultTheme = false;
            mockUseMobileViewport = true;

            render(<InformationTiles {...mocks} />);

            expect(mockInformationTilesItemProps).toHaveBeenCalledWith(
                expect.objectContaining({
                    className: `${styles.tile} ${styles.defaultCarouselItem}`,
                }),
            );
        });

        it('should NOT apply carouselItem class with margin on tablet (isSmallScreen)', () => {
            mocks.params.Theme = InformationTilesTheme.TransparentCarouselVariant;
            mocks.isUsedAsComponent = false;
            mocks.isDefaultTheme = false;
            mockUseTabletViewport = true;

            render(<InformationTiles {...mocks} />);

            expect(mockInformationTilesItemProps).toHaveBeenCalledWith(
                expect.objectContaining({
                    className: `${styles.tile} ${styles.defaultCarouselItem}`,
                }),
            );
        });

        it('should NOT apply carouselItem class with margin when isUsedAsComponent is true', () => {
            mocks.params.Theme = InformationTilesTheme.TransparentCarouselVariant;
            mocks.isUsedAsComponent = true;
            mocks.isDefaultTheme = false;

            render(<InformationTiles {...mocks} />);

            expect(mockInformationTilesItemProps).toHaveBeenCalledWith(
                expect.objectContaining({
                    className: `${styles.tile} ${styles.defaultCarouselItem}`,
                }),
            );
        });

        it('should NOT apply carouselItem class with margin when not transparent variant', () => {
            mocks.params.Theme = InformationTilesTheme.GlobalVariant;
            mocks.isUsedAsComponent = false;
            mocks.isDefaultTheme = false;

            render(<InformationTiles {...mocks} />);

            expect(mockInformationTilesItemProps).toHaveBeenCalledWith(
                expect.objectContaining({
                    className: `${styles.tile} ${styles.defaultCarouselItem}`,
                }),
            );
        });
    });
});
