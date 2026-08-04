import React from 'react';
import { render, screen } from '@testing-library/react';

import { mockCabinBagsFields } from 'frontend/__mocks__/cabinBags';

import AncillariesRoute, { IAnclillariesRouteProps } from './AncillariesRoute';

const createProps = (): IAnclillariesRouteProps => ({
    fields: {
        OutboundIcon: mockCabinBagsFields.OutboundIcon,
        ReturnIcon: mockCabinBagsFields.ReturnIcon,
    },
    children: <div data-tid='children' />,
});

let mockProps = createProps();

const mockRichTextDictionary = jest.fn();
jest.mock('frontend/components/common/RichTextDictionary', () => ({
    __esModule: true,
    default: props => {
        mockRichTextDictionary(props);

        return <div data-tid='rich-text-dictionary' />;
    },
}));

const mockJSSImage = jest.fn();
jest.mock('frontend/components/common/JSSImage', () => ({
    __esModule: true,
    default: ({ ...props }) => {
        mockJSSImage(props);

        return <div data-tid='jss-image' />;
    },
}));

describe('<AncillariesRoute />', () => {
    beforeEach(() => {
        mockProps = createProps();
    });

    it('should render outbound route', () => {
        mockProps.isOutbound = true;

        render(<AncillariesRoute {...mockProps} />);

        expect(mockRichTextDictionary).toHaveBeenCalledWith({
            tag: 'span',
            dictionaryKey: 'SeatMap.Labels.Outbound',
        });
        expect(screen.getByTestId('rich-text-dictionary')).toBeInTheDocument();

        expect(mockJSSImage).toHaveBeenCalledWith({
            'data-tid': 'ancillaries-route-icon',
            field: mockProps.fields.OutboundIcon,
        });
        expect(screen.getByTestId('jss-image')).toBeInTheDocument();
        expect(screen.getByTestId('children')).toBeInTheDocument();
        expect(screen.getByTestId('ancillaries-route-text')).toBeInTheDocument();
    });

    it('should render inbound route', () => {
        render(<AncillariesRoute {...mockProps} />);

        expect(mockRichTextDictionary).toHaveBeenCalledWith({
            tag: 'span',
            dictionaryKey: 'SeatMap.Labels.Return',
        });
        expect(screen.getByTestId('rich-text-dictionary')).toBeInTheDocument();

        expect(mockJSSImage).toHaveBeenCalledWith({
            'data-tid': 'ancillaries-route-icon',
            field: mockProps.fields.ReturnIcon,
        });
        expect(screen.getByTestId('jss-image')).toBeInTheDocument();
        expect(screen.getByTestId('children')).toBeInTheDocument();
        expect(screen.getByTestId('ancillaries-route-text')).toBeInTheDocument();
    });
});
