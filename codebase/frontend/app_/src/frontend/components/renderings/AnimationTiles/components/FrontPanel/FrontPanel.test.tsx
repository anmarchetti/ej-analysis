import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createMockStores } from 'frontend/__mocks__/createMockStores';
import { MediaSize } from 'models/data/MediaSizeParams';

import FrontPanel, { IFrontPanelProps } from './FrontPanel';

const createProps = (): IFrontPanelProps => ({
    Title: { value: 'title' },
    MoreText: { value: 'more text' },
    Icon: { value: { src: 'icon' } },
    Image: { value: { src: 'image' } },
    onClick: jest.fn(),
});

let mockProps;
let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/components/icons-new/ChevronUp', () => ({
    __esModule: true,
    default: () => <div data-tid='chevron-up' />,
}));

const mockJSSImageProps = jest.fn();
jest.mock('frontend/components/common/JSSImageNext/JSSImageNext', () => ({
    __esModule: true,
    JSSImageNext: props => {
        mockJSSImageProps(props);

        return <div data-tid='jss-image' />;
    },
}));

describe('<FrontPanel />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createMockStores();
    });

    it('should call onClick after clicking cross icon', async () => {
        render(<FrontPanel {...mockProps} />);

        await userEvent.click(screen.getByTestId('front-panel'));
        expect(mockProps.onClick).toHaveBeenCalled();
    });

    it('should render background image', () => {
        render(<FrontPanel {...mockProps} />);

        expect(screen.getByTestId('front-panel-background-image')).toBeInTheDocument();
    });

    it('should NOT render background image when image NOT provided', () => {
        mockProps.Image = null;
        render(<FrontPanel {...mockProps} />);

        expect(screen.queryByTestId('front-panel-background-image')).not.toBeInTheDocument();
    });

    it('should render icon', () => {
        render(<FrontPanel {...mockProps} />);

        expect(mockJSSImageProps).toHaveBeenCalledWith(
            expect.objectContaining({
                field: mockProps.Icon,
                mediaSize: MediaSize.Small,
                'data-tid': 'front-panel-icon',
                width: 90,
                height: 90,
            }),
        );
    });

    it('should NOT render icon when icon NOT provided', () => {
        mockProps.Icon = null;
        render(<FrontPanel {...mockProps} />);

        expect(screen.queryByRole('img')).not.toBeInTheDocument();
    });

    it('should render title', () => {
        render(<FrontPanel {...mockProps} />);

        expect(screen.getByText('title')).toBeInTheDocument();
    });

    it('should NOT render title when title NOT provided', () => {
        mockProps.Title = null;
        render(<FrontPanel {...mockProps} />);

        expect(screen.queryByText('title')).not.toBeInTheDocument();
    });

    it('should render more text and ChevronUp icon', () => {
        render(<FrontPanel {...mockProps} />);

        expect(screen.getByText('more text')).toBeInTheDocument();
        expect(screen.getByTestId('chevron-up')).toBeInTheDocument();
    });

    it('should NOT render more text and ChevronUp icon when more text is NOT provided', () => {
        mockProps.MoreText = null;
        render(<FrontPanel {...mockProps} />);

        expect(screen.queryByText('more text')).not.toBeInTheDocument();
        expect(screen.queryByTestId('chevron-up')).not.toBeInTheDocument();
    });
});
