import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { mockSitecoreField, mockSitecoreImageField } from 'frontend/utils/tests.utils';

import ExpandableBanner, { IExpandableBannerProps } from './ExpandableBanner';

const mockExpandableItem = jest.fn();
jest.mock('frontend/components/common/ExpandableItem/ExpandableItem', () => ({
    __esModule: true,
    default: props => {
        mockExpandableItem(props);

        return (
            <div data-tid='expandable-item'>
                {props.children}
                {props.icon}
            </div>
        );
    },
}));

let mockUseMobileViewport = false;
jest.mock('frontend/hooks/useMediaQuery', () => ({
    __esModule: true,
    useMobileViewport: () => mockUseMobileViewport,
}));

const mockJSSImage = jest.fn();
jest.mock('frontend/components/common/JSSImage', () => ({
    __esModule: true,
    default: props => {
        mockJSSImage(props);

        return <div data-tid='jss-image' />;
    },
}));

const mockRichTextWithLinksProps = jest.fn();
jest.mock('frontend/components/common/RichTextWithLinks', () => ({
    __esModule: true,
    default: props => {
        mockRichTextWithLinksProps(props);

        return <div data-tid='rich-text' />;
    },
}));

const mockButtonProps = jest.fn();
jest.mock('frontend/components/common/Button', () => ({
    __esModule: true,
    default: props => {
        mockButtonProps(props);

        return <button data-tid='button' onClick={props.onClick} />;
    },
}));

const mockTextProps = jest.fn();
jest.mock('@sitecore-jss/sitecore-jss-nextjs', () => ({
    __esModule: true,
    Text: props => {
        mockTextProps(props);

        return <div data-tid='jss-sitecore-text' />;
    },
}));

const createProps = (): IExpandableBannerProps => ({
    Title: mockSitecoreField('Test Title'),
    Description: mockSitecoreField('Test Description'),
    Icon: { value: mockSitecoreImageField('/holidays/cms/media/') },
    ButtonLabel: mockSitecoreField('Click me'),
    onButtonClick: jest.fn(),
    dataTidPrefix: 'test-banner',
});

let mockProps = createProps();

describe('<ExpandableBanner />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockUseMobileViewport = false;
    });

    describe('Desktop', () => {
        it('should render banner with icon, title, description and button', () => {
            render(<ExpandableBanner {...mockProps} />);

            expect(screen.getByTestId('test-banner')).toBeInTheDocument();

            expect(screen.getByTestId('jss-image')).toBeInTheDocument();
            expect(mockJSSImage).toHaveBeenCalledWith({
                field: mockProps.Icon,
                className: 'icon',
                'data-tid': 'test-banner-icon',
            });

            expect(screen.getByTestId('jss-sitecore-text')).toBeInTheDocument();
            expect(mockTextProps).toHaveBeenCalledWith({
                field: mockProps.Title,
                className: 'title',
                tag: 'h3',
                'data-tid': 'test-banner-title',
            });

            expect(screen.getByTestId('rich-text')).toBeInTheDocument();
            expect(mockRichTextWithLinksProps).toHaveBeenCalledWith({
                field: mockProps.Description,
                className: 'text',
                dataId: 'test-banner-text',
            });

            expect(screen.getByTestId('button')).toBeInTheDocument();
            expect(mockButtonProps).toHaveBeenCalledWith({
                onClick: mockProps.onButtonClick,
                className: 'button',
                'data-tid': 'test-banner-btn',
                children: 'Click me',
            });
        });

        it('should NOT render button when ButtonLabel is not provided', () => {
            mockProps.ButtonLabel = undefined;

            render(<ExpandableBanner {...mockProps} />);

            expect(screen.queryByTestId('button')).not.toBeInTheDocument();
        });

        it('should NOT render button when ButtonLabel value is empty', () => {
            mockProps.ButtonLabel = mockSitecoreField('');

            render(<ExpandableBanner {...mockProps} />);

            expect(screen.queryByTestId('button')).not.toBeInTheDocument();
        });

        it('should render custom button prop', () => {
            mockProps.ButtonLabel = undefined;

            render(<ExpandableBanner {...mockProps} button={<div data-tid='custom-button' />} />);

            expect(screen.getByTestId('custom-button')).toBeInTheDocument();
        });

        it('should call onButtonClick when button is clicked', async () => {
            render(<ExpandableBanner {...mockProps} />);

            await userEvent.click(screen.getByTestId('button'));

            expect(mockProps.onButtonClick).toHaveBeenCalled();
        });
    });

    describe('Mobile', () => {
        beforeEach(() => {
            mockUseMobileViewport = true;
        });

        it('should render banner with ExpandableItem on mobile', () => {
            render(<ExpandableBanner {...mockProps} />);

            expect(screen.getByTestId('test-banner')).toBeInTheDocument();

            expect(screen.getByTestId('expandable-item')).toBeInTheDocument();
            expect(mockExpandableItem).toHaveBeenCalledWith({
                title: mockProps.Title.value,
                titleClassName: 'title',
                children: expect.anything(),
                icon: expect.anything(),
                titleWrapperClassName: 'titleWrapper',
                className: 'expandable',
                dataTid: 'test-banner-expandable',
                isOpened: undefined,
            });

            expect(screen.getByTestId('jss-image')).toBeInTheDocument();
            expect(mockJSSImage).toHaveBeenCalledWith({
                field: mockProps.Icon,
                className: 'icon',
                'data-tid': 'test-banner-icon',
            });

            expect(screen.getByTestId('rich-text')).toBeInTheDocument();
            expect(mockRichTextWithLinksProps).toHaveBeenCalledWith({
                field: mockProps.Description,
                className: 'text',
                dataId: 'test-banner-text',
            });

            expect(screen.getByTestId('button')).toBeInTheDocument();
            expect(mockButtonProps).toHaveBeenCalledWith({
                onClick: mockProps.onButtonClick,
                className: 'button',
                'data-tid': 'test-banner-btn',
                children: 'Click me',
            });
        });

        it('should NOT render button when ButtonLabel is not provided on mobile', () => {
            mockProps.ButtonLabel = undefined;

            render(<ExpandableBanner {...mockProps} />);

            expect(screen.queryByTestId('button')).not.toBeInTheDocument();
        });

        it('should render custom button prop on mobile', () => {
            mockProps.ButtonLabel = undefined;

            render(<ExpandableBanner {...mockProps} button={<div data-tid='custom-button' />} />);

            expect(screen.getByTestId('custom-button')).toBeInTheDocument();
        });

        it('should call onButtonClick when button is clicked on mobile', async () => {
            render(<ExpandableBanner {...mockProps} />);

            await userEvent.click(screen.getByTestId('button'));

            expect(mockProps.onButtonClick).toHaveBeenCalled();
        });

        it('should render mobile view when isMobileView is true regardless of viewport', () => {
            mockUseMobileViewport = false;

            render(<ExpandableBanner {...mockProps} isMobileView={true} />);

            expect(screen.getByTestId('expandable-item')).toBeInTheDocument();
        });

        it('should pass isDefaultOpened to ExpandableItem as isOpened', () => {
            render(<ExpandableBanner {...mockProps} isDefaultOpened={true} />);

            expect(mockExpandableItem).toHaveBeenCalledWith(
                expect.objectContaining({
                    isOpened: true,
                }),
            );
        });

        it('should apply custom classNames when provided', () => {
            render(
                <ExpandableBanner
                    {...mockProps}
                    titleClassName='customTitle'
                    descriptionClassName='customDesc'
                    iconClassName='customIcon'
                    mobileClassName='customMobile'
                />,
            );

            expect(mockExpandableItem).toHaveBeenCalledWith(
                expect.objectContaining({
                    titleClassName: 'title customTitle',
                }),
            );

            expect(mockJSSImage).toHaveBeenCalledWith(
                expect.objectContaining({
                    className: 'icon customIcon',
                }),
            );

            expect(mockRichTextWithLinksProps).toHaveBeenCalledWith(
                expect.objectContaining({
                    className: 'text customDesc',
                }),
            );
        });
    });
});
