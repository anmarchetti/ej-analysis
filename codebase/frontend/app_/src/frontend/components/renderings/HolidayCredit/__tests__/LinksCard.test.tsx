import React from 'react';
import { render } from '@testing-library/react';

import LinksCard from 'frontend/components/renderings/HolidayCredit/LinksCard';

const createProps = () => ({
    fields: {} as any,
    params: {} as any,
    rendering: {} as any,
});

const createStores = () => ({
    layoutStore: {},
    routerStore: {},
    appStore: {},
    queryParamStore: {},
    userStore: {},
});

let mockProps;
let mockStores = createStores();

jest.mock('frontend/components/common/RouterLink', () => () => <div data-tid='link' />);

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<LinksCard />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    describe('Description', () => {
        it('should render links_card--description if fields.Description is NOT empty', () => {
            mockProps.fields.Description = { value: 'description' };
            const { getByText } = render(<LinksCard {...mockProps} />);

            expect(getByText('description')).toBeInTheDocument();
        });

        it('should NOT render links_card--description if fields.Description is empty', () => {
            const { queryByText } = render(<LinksCard {...mockProps} />);

            expect(queryByText('description')).not.toBeInTheDocument();
        });
    });

    describe('Links', () => {
        it('should NOT render list items if fields.Links is empty', () => {
            const { queryByTestId } = render(<LinksCard {...mockProps} />);

            expect(queryByTestId('link')).not.toBeInTheDocument();
        });

        it('should NOT render list items if fields.Links have no subfields', () => {
            mockProps.fields.Links = [
                {
                    id: 'test1',
                },
                {
                    id: 'test2',
                },
            ];
            const { queryByTestId } = render(<LinksCard {...mockProps} />);

            expect(queryByTestId('link')).not.toBeInTheDocument();
        });

        it('should NOT render list items if fields.Links subfields have no texts', () => {
            mockProps.fields.Links = [
                {
                    id: 'test1',
                    fields: {
                        Link: {},
                    },
                },
                {
                    id: 'test2',
                    fields: {
                        Link: {},
                    },
                },
            ];
            const { queryByTestId } = render(<LinksCard {...mockProps} />);

            expect(queryByTestId('link')).not.toBeInTheDocument();
        });

        it('should render list items if fields.Links is NOT empty', () => {
            mockProps.fields.Links = [
                {
                    id: 'test1',
                    fields: {
                        Link: {
                            value: {
                                text: 'text1',
                            },
                        },
                    },
                },
                {
                    id: 'test2',
                    fields: {
                        Link: {
                            value: {
                                text: 'text2',
                            },
                        },
                    },
                },
            ];
            const { getAllByTestId } = render(<LinksCard {...mockProps} />);

            expect(getAllByTestId('link').length).toBe(mockProps.fields.Links.length);
        });
    });
});
