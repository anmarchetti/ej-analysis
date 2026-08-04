import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createMockStores } from 'frontend/__mocks__/createMockStores';
import { MediaSize } from 'models/data/MediaSizeParams';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import ActivePanel, { IActivePanelProps } from './ActivePanel';

import styles from './ActivePanel.module.scss';

const createProps = (): IActivePanelProps => ({
    Title: { value: 'title' },
    Description: { value: 'description' },
    Icon: { value: { src: 'icon' } },
    hideContainer: false,
    onClick: jest.fn(),
});

let mockProps;
let mockStores;

let mockUseMobileViewport = false;
jest.mock('frontend/hooks/useMediaQuery', () => ({
    useMobileViewport: () => mockUseMobileViewport,
}));

jest.mock('frontend/components/icons-new/Cross', () => ({
    __esModule: true,
    default: () => <div data-tid='cross' />,
}));

const mockJSSImageProps = jest.fn();
jest.mock('frontend/components/common/JSSImageNext/JSSImageNext', () => ({
    __esModule: true,
    JSSImageNext: props => {
        mockJSSImageProps(props);

        return <div data-tid='jss-image' />;
    },
}));

const mockRichTextWithLinks = jest.fn();
jest.mock('frontend/components/common/RichTextWithLinks', () => ({
    __esModule: true,
    default: props => {
        mockRichTextWithLinks(props);

        return <div data-tid='rich-text-with-links' />;
    },
}));

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<ActivePanel />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createMockStores();
        mockUseMobileViewport = false;
    });

    it('should render tile with description without hideContainer className and all interactive elements as focusable when hideContainer is false', () => {
        render(<ActivePanel {...mockProps} />);

        expect(screen.getByTestId('active-panel')).toBeInTheDocument();
        expect(screen.getByTestId('active-panel')).not.toHaveClass(styles.hideContainer);
        expect(screen.getByTestId('active-panel-content')).toHaveAttribute('tabIndex', '-1');
        expect(screen.getByRole('button')).toHaveAttribute('tabIndex', '0');
        expect(mockRichTextWithLinks).toHaveBeenCalledWith(
            expect.objectContaining({
                disableLinkFocus: false,
            }),
        );
    });

    it('should render tile with description with hideContainer className and all interactive elements as non-focusable when hideContainer is true', () => {
        mockProps.hideContainer = true;
        render(<ActivePanel {...mockProps} />);

        expect(screen.getByTestId('active-panel')).toHaveClass(styles.hideContainer);
        expect(screen.getByTestId('active-panel-content')).toHaveAttribute('tabIndex', '-1');
        expect(screen.getByRole('button')).toHaveAttribute('tabIndex', '-1');
        expect(mockRichTextWithLinks).toHaveBeenCalledWith(
            expect.objectContaining({
                disableLinkFocus: true,
            }),
        );
    });

    it('should render button with cross icon', () => {
        render(<ActivePanel {...mockProps} />);

        expect(screen.getByRole('button')).toBeInTheDocument();
        expect(screen.getByTestId('cross')).toBeInTheDocument();
    });

    it('should call onClick after clicking cross icon', async () => {
        render(<ActivePanel {...mockProps} />);

        await userEvent.click(screen.getByTestId('cross'));

        expect(mockProps.onClick).toHaveBeenCalled();
    });

    it('should render icon', () => {
        render(<ActivePanel {...mockProps} />);

        expect(screen.getByTestId('jss-image')).toBeInTheDocument();
        expect(mockJSSImageProps).toHaveBeenCalledWith(
            expect.objectContaining({
                mediaSize: MediaSize.Small,
                field: mockProps.Icon,
                className: 'icon',
                'data-tid': 'active-panel-icon',
            }),
        );
    });

    it('should NOT render icon when icon is NOT provided', () => {
        mockProps.Icon = null;
        render(<ActivePanel {...mockProps} />);

        expect(screen.queryByRole('img')).not.toBeInTheDocument();
    });

    it('should render title', () => {
        render(<ActivePanel {...mockProps} />);

        expect(screen.getByText('title')).toBeInTheDocument();
    });

    it('should NOT render title when title is NOT provided', () => {
        mockProps.Title = null;
        render(<ActivePanel {...mockProps} />);

        expect(screen.queryByText('title')).not.toBeInTheDocument();
    });

    it('should render description', () => {
        render(<ActivePanel {...mockProps} />);

        expect(mockRichTextWithLinks).toHaveBeenCalledWith({
            field: mockProps.Description,
            className: styles.description,
            disableLinkFocus: false,
            dataId: 'active-panel-description',
        });
    });

    it('should NOT render description when description is NOT provided', () => {
        mockProps.Description = null;
        render(<ActivePanel {...mockProps} />);

        expect(mockRichTextWithLinks).not.toHaveBeenCalled();
    });

    describe('Accessibility', () => {
        it('should render aria-label', () => {
            render(<ActivePanel {...mockProps} />);

            expect(screen.getByRole('button')).toHaveAttribute(
                'aria-label',
                SitecoreDictionary.AccessibilityAriaLabelsClosePanelButton,
            );
        });
    });
});
