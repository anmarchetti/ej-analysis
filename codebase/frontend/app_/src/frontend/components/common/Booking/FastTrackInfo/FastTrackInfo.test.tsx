import { render, screen } from '@testing-library/react';

import FastTrackInfo, { IFastTrackInfoProps } from './FastTrackInfo';

const mockFastTrackInfoFields = {
    FastTrackLabel: {
        value: '{count} x Fast track',
    },
    FastTrackLogo: {
        value: {
            src: '/-/media/logos/fast-track.svg',
            alt: 'Fast Track logo',
        },
    },
};

const createProps = (): IFastTrackInfoProps => ({
    count: 3,
    fields: mockFastTrackInfoFields,
    containerClassName: 'fast-track-container',
    iconClassName: 'fast-track-icon',
});

let mockProps = createProps();
const mockJSSImage = jest.fn();

jest.mock('frontend/components/common/JSSImage', () => ({
    __esModule: true,
    default: ({ ...props }) => {
        mockJSSImage(props);

        return <div data-tid='jss-image' />;
    },
}));

describe('<FastTrackInfo />', () => {
    beforeEach(() => {
        mockProps = createProps();
    });

    it('should render the component with correct text and icon', () => {
        render(<FastTrackInfo {...mockProps} />);

        const container = screen.getByTestId('fast-track-info');

        expect(container).toBeInTheDocument();
        expect(container).toHaveClass(mockProps.containerClassName as string);
        expect(container).toHaveTextContent('3 x Fast track');
        expect(mockJSSImage).toHaveBeenCalledTimes(1);
        expect(mockJSSImage).toHaveBeenCalledWith({
            field: mockFastTrackInfoFields.FastTrackLogo,
            className: mockProps.iconClassName,
            alt: 'fast track logo',
            'data-tid': 'fast-track-icon',
        });
    });

    it('should NOT render the component when count is 0', () => {
        mockProps.count = 0;

        render(<FastTrackInfo {...mockProps} />);

        const container = screen.queryByTestId('fast-track-info');

        expect(container).not.toBeInTheDocument();
    });

    it('should NOT render the icon when hideIcon is true', () => {
        mockProps.hideIcon = true;

        render(<FastTrackInfo {...mockProps} />);

        const container = screen.getByTestId('fast-track-info');

        expect(container).toHaveTextContent('3 x Fast track');
        expect(mockJSSImage).not.toHaveBeenCalled();
    });
});
