import { render, screen } from '@testing-library/react';

import { mockSitecoreField } from 'frontend/utils/tests.utils';

import Itineraries, { IIItinerariesPropsFields, TItinerariesProps } from './Itineraries';

const mockDestinationGuides = jest.fn();
jest.mock('frontend/components/common/DestinationGuides', () => ({
    __esModule: true,
    default: props => {
        mockDestinationGuides(props);

        return <div data-tid='destination-guides' />;
    },
}));

describe('<Itineraries />', () => {
    let props: TItinerariesProps;

    beforeEach(() => {
        props = {
            fields: {
                items: [
                    {
                        children: [
                            {
                                id: '1',
                                displayName: 'Tour 1',
                                fields: {
                                    CentralPointLatidiute: mockSitecoreField('40.7128'),
                                    CentralPointLongitude: mockSitecoreField('-74.0060'),
                                    Description: mockSitecoreField('Description 1'),
                                    Duration: mockSitecoreField('5 days'),
                                    Image: mockSitecoreField({ src: 'image1.jpg' }),
                                    Name: mockSitecoreField('Tour Name 1'),
                                    TotalDistance: mockSitecoreField('100 miles'),
                                    Zoom: mockSitecoreField(10),
                                },
                            },
                        ],
                    },
                ],
            },
        } as TItinerariesProps;
    });

    it('should render DestinationGuides', () => {
        render(<Itineraries {...props} />);

        expect(mockDestinationGuides).toHaveBeenCalledWith({
            tours: [
                {
                    displayName: 'Tour 1',
                    fields: {
                        CentralPointLatidiute: mockSitecoreField('40.7128'),
                        CentralPointLongitude: mockSitecoreField('-74.0060'),
                        Description: mockSitecoreField('Description 1'),
                        Duration: mockSitecoreField('5 days'),
                        Image: mockSitecoreField({ src: 'image1.jpg' }),
                        Name: mockSitecoreField('Tour Name 1'),
                        TotalDistance: mockSitecoreField('100 miles'),
                        Zoom: mockSitecoreField(10),
                    },
                    id: '1',
                },
            ],
        });
    });

    it('should NOT render DestinationGuides when items are empty', () => {
        props.fields!.items = [] as unknown as IIItinerariesPropsFields['items'];

        render(<Itineraries {...props} />);

        expect(screen.queryByTestId('destination-guides')).toBeNull();
    });
});
