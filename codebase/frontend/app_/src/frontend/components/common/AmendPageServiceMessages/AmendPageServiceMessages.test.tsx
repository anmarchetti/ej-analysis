import React from 'react';
import { waitFor } from '@testing-library/dom';
import { render, screen } from '@testing-library/react';

import { createMockStores, mockRoomAndBoardRoomVariant } from 'frontend/__mocks__';
import { GuestType } from 'models/enum/GuestType';
import { PlaceholderNames } from 'models/enum/PlaceholderNames';

import AmendPageServiceMessages from './AmendPageServiceMessages';
import { AmendServiceMessages, fetchErrataOfferMessages } from './AmendPageServiceMessages.utils';

const createProps = () => ({
    rendering: 'rendering',
});

const mockMessagePlaceholder = jest.fn();
let mockRenderCustomHandlerResult;
let mockMessageType;
jest.mock('@sitecore-jss/sitecore-jss-nextjs', () => ({
    __esModule: true,
    Placeholder: ({ name, renderCustomMetaData, ...props }) => {
        mockMessagePlaceholder(props);
        mockRenderCustomHandlerResult = renderCustomMetaData(mockMessageType);

        return <div data-tid={name} />;
    },
}));

jest.mock('./AmendPageServiceMessages.utils');

const mockFetchErrataOfferMessages = fetchErrataOfferMessages as jest.MockedFn<typeof fetchErrataOfferMessages>;

let mockProps;
let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<AmendPageServiceMessages />', () => {
    beforeEach(() => {
        mockStores = createMockStores({
            amendRoomAndBoardStore: {
                roomVariants: [mockRoomAndBoardRoomVariant],
                isFreeChildPlaceVariantIncluded: false,
            },
            layoutStore: {
                isAmendRoomAndBoardPage: false,
            },
        });
        mockProps = createProps();
    });

    describe('serviceMessageRenderCustomMetaData function', () => {
        describe('Called with Free child place', () => {
            mockFetchErrataOfferMessages.mockResolvedValue(['message 1', 'message 2']);
            mockMessageType = AmendServiceMessages.FreeChildPlace;

            it('Should return an empty object if not a amendRoomAndBoard flow', async () => {
                render(<AmendPageServiceMessages {...mockProps} />);

                await waitFor(() => {
                    expect(mockRenderCustomHandlerResult).toStrictEqual({});
                });
            });

            it('Should return isVisible = false on amend room and board flow, and no roomVariants', async () => {
                mockStores.layoutStore.isAmendRoomAndBoardPage = true;
                mockStores.amendRoomAndBoardStore.roomVariants = [];
                render(<AmendPageServiceMessages {...mockProps} />);

                await waitFor(() => {
                    expect(mockRenderCustomHandlerResult).toStrictEqual({ isVisible: false });
                });
            });

            it('Should return isVisible = false on amend room and board flow, and no child in booking', async () => {
                mockStores.layoutStore.isAmendRoomAndBoardPage = true;
                render(<AmendPageServiceMessages {...mockProps} />);

                await waitFor(() => {
                    expect(mockRenderCustomHandlerResult).toStrictEqual({ isVisible: false });
                });
            });

            it('Should return isVisible = false on amend room and board flow, and roomVariants contain child', async () => {
                mockStores.layoutStore.isAmendRoomAndBoardPage = true;
                mockStores.amendRoomAndBoardStore.isFreeChildPlaceVariantIncluded = true;
                render(<AmendPageServiceMessages {...mockProps} />);

                await waitFor(() => {
                    expect(mockRenderCustomHandlerResult).toStrictEqual({
                        isVisible: false,
                    });
                });
            });

            it('Should return isVisible = true on amend room and board flow, and roomVariants not contain child, and child is in booking', async () => {
                mockStores.layoutStore.isAmendRoomAndBoardPage = true;
                mockStores.amendRoomAndBoardStore.isFreeChildPlaceVariantIncluded = false;
                mockStores.viewBookingStore.booking.guests[0].type = GuestType.Child;
                render(<AmendPageServiceMessages {...mockProps} />);

                await waitFor(() => {
                    expect(mockRenderCustomHandlerResult).toStrictEqual({
                        isVisible: true,
                    });
                });
            });
        });

        describe('Called with Errata type', () => {
            it('Should return correct object when hotelErrataMessages has items', async () => {
                mockMessageType = AmendServiceMessages.Errata;
                mockFetchErrataOfferMessages.mockResolvedValue(['message 1', 'message 2']);
                render(<AmendPageServiceMessages {...mockProps} />);

                await waitFor(() => {
                    expect(mockRenderCustomHandlerResult).toStrictEqual({
                        fields: { Description: { value: 'message 1<br />message 2' } },
                        isVisible: true,
                        isExpandedByDefault: false,
                    });
                });
            });

            it('Should remove unnecessary figures from messages', async () => {
                mockMessageType = AmendServiceMessages.Errata;
                mockFetchErrataOfferMessages.mockResolvedValue([
                    'message 1 <br>                    <br>                    <br>                    <br>',
                    'message <br> 2 <br>                    <br>                    <br>                    <br>',
                ]);
                render(<AmendPageServiceMessages {...mockProps} />);

                await waitFor(() => {
                    expect(mockRenderCustomHandlerResult).toStrictEqual({
                        fields: { Description: { value: 'message 1<br />message <br> 2' } },
                        isVisible: true,
                        isExpandedByDefault: false,
                    });
                });
            });

            it('Should return correct object when hotelErrataMessages has NO items', async () => {
                mockMessageType = AmendServiceMessages.Errata;
                mockFetchErrataOfferMessages.mockResolvedValue([]);
                render(<AmendPageServiceMessages {...mockProps} />);

                await waitFor(() => {
                    expect(mockRenderCustomHandlerResult).toStrictEqual({
                        fields: { Description: { value: '' } },
                        isVisible: false,
                        isExpandedByDefault: false,
                    });
                });
            });
        });

        it('Return {} when it was called with NON errata type', async () => {
            mockMessageType = '';
            mockFetchErrataOfferMessages.mockResolvedValue(['message 1', 'message 2']);
            render(<AmendPageServiceMessages {...mockProps} />);

            await waitFor(() => {
                expect(mockRenderCustomHandlerResult).toStrictEqual({});
            });
        });
    });

    describe('fetchErrataOfferMessages', () => {
        it('Should be invoked', async () => {
            render(<AmendPageServiceMessages {...mockProps} />);
            await waitFor(() => {
                expect(fetchErrataOfferMessages).toHaveBeenCalledWith(mockStores.viewBookingStore.booking, undefined);
            });
        });

        it('Should be invoked with errataOverrides', async () => {
            mockProps.errataOverrides = { date: '2024-11-01' };
            render(<AmendPageServiceMessages {...mockProps} />);

            await waitFor(() => {
                expect(fetchErrataOfferMessages).toHaveBeenCalledWith(
                    mockStores.viewBookingStore.booking,
                    mockProps.errataOverrides,
                );
            });
        });

        it('Should not be called if booking is not defined', async () => {
            mockStores.viewBookingStore.booking = null;
            render(<AmendPageServiceMessages {...mockProps} />);

            await waitFor(() => {
                expect(fetchErrataOfferMessages).not.toHaveBeenCalled();
            });
        });
    });

    it('Render component', async () => {
        render(<AmendPageServiceMessages {...mockProps} />);

        await waitFor(() => {
            expect(screen.getByTestId(PlaceholderNames.AttentionMessage)).toBeInTheDocument();
            expect(mockMessagePlaceholder).toHaveBeenCalledWith(
                expect.objectContaining({
                    containerClassName: 'serviceMessage',
                    rendering: 'rendering',
                    collapsible: true,
                }),
            );
        });
    });
});
