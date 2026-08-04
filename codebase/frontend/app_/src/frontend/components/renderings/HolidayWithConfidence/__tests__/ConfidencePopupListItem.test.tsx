import React from 'react';
import { render, screen } from '@testing-library/react';

import { MediaSize } from 'models/data/MediaSizeParams';
import ConfidencePopupListItem from 'frontend/components/renderings/HolidayWithConfidence/components/ConfidencePopupListItem';

const createProps = () => ({
    id: 1,
    fields: { Icon: { value: { src: 'icon' } }, Title: { value: 'title' }, Text: { value: 'text' } },
});

const createStores = () => ({ layoutStore: {}, appStore: {}, routerStore: {} });

let mockProps;
let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockJSSIMageNextProps = jest.fn();
jest.mock('frontend/components/common/JSSImageNext/JSSImageNext', () => ({
    __esModule: true,
    JSSImageNext: props => {
        mockJSSIMageNextProps(props);

        return <div data-tid='jss-image-next' />;
    },
}));

describe('<ConfidencePopupListItem />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('should render Icon', () => {
        render(<ConfidencePopupListItem {...mockProps} />);

        expect(screen.getByTestId('jss-image-next')).toBeInTheDocument();
        expect(mockJSSIMageNextProps).toHaveBeenCalledWith(
            expect.objectContaining({
                field: mockProps.fields.Icon,
                fill: true,
                mediaSize: MediaSize.Small,
            }),
        );
    });

    it('should render title', () => {
        const { getByText } = render(<ConfidencePopupListItem {...mockProps} />);

        expect(getByText('title')).toBeInTheDocument();
    });

    it('should render text', () => {
        const { getByText } = render(<ConfidencePopupListItem {...mockProps} />);

        expect(getByText('text')).toBeInTheDocument();
    });
});
