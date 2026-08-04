import { renderHook } from '@testing-library/react';

import { Tokens } from 'code/tokens';
import {
    createMockStores,
    mockAltNoTransfer,
    mockAltPrivateTransfer,
    mockAltTransfer,
    mockTransfer,
    mockTransferFields,
} from 'frontend/__mocks__';
import { mockReplaceToken } from 'frontend/__mocks__/utils/tokenizer';

import useSEAccommodationFail from './useSEAccommodationFail';

const selectedLugMock = { LUS: 1 };
const selectedSportMock = { BIKE: 1 };
const clearHoldLuggageMock = jest.fn();
const setSportEquipmentMock = jest.fn();

const createStores = () =>
    createMockStores({
        bookingStore: {
            isTransferRemoveSE: false,
            isSERemoveTransfer: false,
            isTransferRemoveLargeSE: false,
            isLargeSERemoveTransfer: false,
            isTransferNotAccommodatingSE: false,
            alternativeTransfers: mockAltTransfer,
            transferCandidate: mockTransfer,
            prevTransfer: mockAltPrivateTransfer,
            clearSEAccommodationFails: jest.fn(),
            changeTransfer: jest.fn(),
            setTransferCandidate: jest.fn(),
            setPrevTransfer: jest.fn(),
            extraLuggage: {
                largeSportEquipmentList: '(1 x Bike)',
                confirmExtraLuggage: jest.fn(),
                actualizeLuggageParams: jest.fn(),
                sportEquipmentPossibleToTransfer: jest.fn(),
            },
        },
    });

let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/utils/tokenizer', () => ({ Tokenizer: { replaceToken: mockReplaceToken } }));

describe('useSEAccommodationFail', () => {
    beforeEach(() => {
        mockStores = createStores();
    });

    it('should return null when NO fail', () => {
        const { result } = renderHook(() =>
            useSEAccommodationFail(
                selectedLugMock,
                selectedSportMock,
                clearHoldLuggageMock,
                setSportEquipmentMock,
                mockTransferFields,
            ),
        );

        expect(result.current).toEqual(null);
    });

    it('should return null when NO fields', () => {
        mockStores.bookingStore.isTransferRemoveSE = true;

        const { result } = renderHook(() =>
            useSEAccommodationFail(selectedLugMock, selectedSportMock, clearHoldLuggageMock, setSportEquipmentMock),
        );

        expect(result.current).toEqual(null);
    });

    it('should return null when NO corresponding fields', () => {
        mockStores.bookingStore.isTransferRemoveSE = true;
        const mockedFields = { ...mockTransferFields, TransferRemoveSEPopup: undefined } as any;

        const { result } = renderHook(() =>
            useSEAccommodationFail(
                selectedLugMock,
                selectedSportMock,
                clearHoldLuggageMock,
                setSportEquipmentMock,
                mockedFields,
            ),
        );

        expect(result.current).toEqual(null);
    });

    describe('transfer remove sport equipment', () => {
        beforeEach(() => {
            mockStores.bookingStore.isTransferRemoveSE = true;
        });

        it('should return corresponding fields', () => {
            const { result } = renderHook(() =>
                useSEAccommodationFail(
                    selectedLugMock,
                    selectedSportMock,
                    clearHoldLuggageMock,
                    setSportEquipmentMock,
                    mockTransferFields,
                ),
            );
            const [fields] = result.current!;

            expect(fields).toEqual(mockTransferFields.TransferRemoveSEPopup.fields);
        });

        describe('onConfirm', () => {
            it('should call proper functions when transferCandidate exists', async () => {
                const { result } = renderHook(() =>
                    useSEAccommodationFail(
                        selectedLugMock,
                        selectedSportMock,
                        clearHoldLuggageMock,
                        setSportEquipmentMock,
                        mockTransferFields,
                    ),
                );

                const [_fields, onConfirm] = result.current!;

                await onConfirm();

                expect(mockStores.bookingStore.clearSEAccommodationFails).toHaveBeenCalled();
                expect(setSportEquipmentMock).toHaveBeenCalledWith(
                    mockStores.bookingStore.extraLuggage.sportEquipmentPossibleToTransfer,
                );
                expect(mockStores.bookingStore.extraLuggage.actualizeLuggageParams).toHaveBeenCalledWith(
                    selectedLugMock,
                    mockStores.bookingStore.extraLuggage.sportEquipmentPossibleToTransfer,
                );
                expect(mockStores.bookingStore.changeTransfer).toHaveBeenCalled();
            });

            it('should call proper functions when transferCandidate does NOT exists', async () => {
                mockStores.bookingStore.transferCandidate = null;

                const { result } = renderHook(() =>
                    useSEAccommodationFail(
                        selectedLugMock,
                        selectedSportMock,
                        clearHoldLuggageMock,
                        setSportEquipmentMock,
                        mockTransferFields,
                    ),
                );

                const [_fields, onConfirm] = result.current!;

                await onConfirm();

                expect(setSportEquipmentMock).toHaveBeenCalledWith(
                    mockStores.bookingStore.extraLuggage.sportEquipmentPossibleToTransfer,
                );
                expect(mockStores.bookingStore.setPrevTransfer).toHaveBeenCalledWith(null);
                expect(mockStores.bookingStore.extraLuggage.confirmExtraLuggage).toHaveBeenCalledWith(
                    selectedLugMock,
                    mockStores.bookingStore.extraLuggage.sportEquipmentPossibleToTransfer,
                    clearHoldLuggageMock,
                );
            });
        });

        describe('onCancel', () => {
            it('should call setTransferCandidate when transferCandidate exists', async () => {
                const { result } = renderHook(() =>
                    useSEAccommodationFail(
                        selectedLugMock,
                        selectedSportMock,
                        clearHoldLuggageMock,
                        setSportEquipmentMock,
                        mockTransferFields,
                    ),
                );
                const [_fields, _onConfirm, onCancel] = result.current!;

                await onCancel();

                expect(mockStores.bookingStore.clearSEAccommodationFails).toHaveBeenCalled();
                expect(mockStores.bookingStore.setTransferCandidate).toHaveBeenCalledWith(null);
            });

            it('should call changeTransfer with prevTransfer when transferCandidate does NOT exists', async () => {
                mockStores.bookingStore.transferCandidate = null;

                const { result } = renderHook(() =>
                    useSEAccommodationFail(
                        selectedLugMock,
                        selectedSportMock,
                        clearHoldLuggageMock,
                        setSportEquipmentMock,
                        mockTransferFields,
                    ),
                );
                const [_fields, _onConfirm, onCancel] = result.current!;

                await onCancel();

                expect(mockStores.bookingStore.changeTransfer).toHaveBeenCalledWith(mockAltPrivateTransfer);
                expect(mockStores.bookingStore.setPrevTransfer).toHaveBeenCalledWith(null);
            });

            it('should call changeTransfer with noTransfer when transferCandidate AND prevTransfer does NOT exist', async () => {
                mockStores.bookingStore.transferCandidate = null;
                mockStores.bookingStore.prevTransfer = null;

                const { result } = renderHook(() =>
                    useSEAccommodationFail(
                        selectedLugMock,
                        selectedSportMock,
                        clearHoldLuggageMock,
                        setSportEquipmentMock,
                        mockTransferFields,
                    ),
                );
                const [_fields, _onConfirm, onCancel] = result.current!;

                await onCancel();

                expect(mockStores.bookingStore.changeTransfer).toHaveBeenCalledWith(mockAltNoTransfer);
            });
        });
    });

    describe('transfer remove large sport equipment', () => {
        const correspondingFields = mockTransferFields.TransferRemoveLargeSEPopup.fields;

        beforeEach(() => {
            mockStores.bookingStore.isTransferRemoveLargeSE = true;
            mockStores.bookingStore.transferCandidate = null;
        });

        it('should return proper fields and onCancel callback', () => {
            const { result } = renderHook(() =>
                useSEAccommodationFail(
                    selectedLugMock,
                    selectedSportMock,
                    clearHoldLuggageMock,
                    setSportEquipmentMock,
                    mockTransferFields,
                ),
            );
            const [fields, _onConfirm, onCancel] = result.current!;

            expect(fields).toEqual({
                ...correspondingFields,
                Description: {
                    value: `${correspondingFields.Description.value} ${mockStores.bookingStore.extraLuggage.largeSportEquipmentList}`,
                },
            });

            onCancel();

            expect(mockStores.bookingStore.clearSEAccommodationFails).toHaveBeenCalled();
            expect(mockStores.bookingStore.changeTransfer).toHaveBeenCalledWith(mockAltPrivateTransfer);
            expect(mockReplaceToken).toHaveBeenCalledWith(
                mockTransferFields.TransferRemoveLargeSEPopup.fields.Description.value,
                Tokens.SelectedSport,
                mockStores.bookingStore.extraLuggage.largeSportEquipmentList,
            );
        });

        describe('onConfirm', () => {
            it('should call proper functions when transferCandidate exists', async () => {
                mockStores.bookingStore.transferCandidate = mockTransfer;

                const { result } = renderHook(() =>
                    useSEAccommodationFail(
                        selectedLugMock,
                        selectedSportMock,
                        clearHoldLuggageMock,
                        setSportEquipmentMock,
                        mockTransferFields,
                    ),
                );

                const [_fields, onConfirm] = result.current!;

                await onConfirm();

                expect(mockStores.bookingStore.clearSEAccommodationFails).toHaveBeenCalled();

                expect(setSportEquipmentMock).toHaveBeenCalledWith(
                    mockStores.bookingStore.extraLuggage.sportEquipmentPossibleToTransfer,
                );
                expect(mockStores.bookingStore.extraLuggage.actualizeLuggageParams).toHaveBeenCalledWith(
                    selectedLugMock,
                    mockStores.bookingStore.extraLuggage.sportEquipmentPossibleToTransfer,
                );
                expect(mockStores.bookingStore.changeTransfer).toHaveBeenCalled();
            });

            it('should call proper functions when transferCandidate does NOT exists', async () => {
                const { result } = renderHook(() =>
                    useSEAccommodationFail(
                        selectedLugMock,
                        selectedSportMock,
                        clearHoldLuggageMock,
                        setSportEquipmentMock,
                        mockTransferFields,
                    ),
                );

                const [_fields, onConfirm] = result.current!;

                await onConfirm();

                expect(setSportEquipmentMock).toHaveBeenCalledWith(
                    mockStores.bookingStore.extraLuggage.sportEquipmentPossibleToTransfer,
                );
                expect(mockStores.bookingStore.setPrevTransfer).toHaveBeenCalledWith(null);
                expect(mockStores.bookingStore.extraLuggage.confirmExtraLuggage).toHaveBeenCalledWith(
                    selectedLugMock,
                    mockStores.bookingStore.extraLuggage.sportEquipmentPossibleToTransfer,
                    clearHoldLuggageMock,
                );
            });
        });
    });

    describe('sport equipment remove transfer', () => {
        beforeEach(() => {
            mockStores.bookingStore.isSERemoveTransfer = true;
        });

        it('should return proper fields and onCancel callback', () => {
            const { result } = renderHook(() =>
                useSEAccommodationFail(
                    selectedLugMock,
                    selectedSportMock,
                    clearHoldLuggageMock,
                    setSportEquipmentMock,
                    mockTransferFields,
                ),
            );
            const [fields, _onConfirm, onCancel] = result.current!;

            expect(fields).toEqual(mockTransferFields.SERemoveTransferPopup.fields);

            onCancel();

            expect(setSportEquipmentMock).toHaveBeenCalledWith(
                mockStores.bookingStore.extraLuggage.sportEquipmentPossibleToTransfer,
            );
            expect(mockStores.bookingStore.extraLuggage.confirmExtraLuggage).toHaveBeenCalledWith(
                selectedLugMock,
                mockStores.bookingStore.extraLuggage.sportEquipmentPossibleToTransfer,
                clearHoldLuggageMock,
            );
        });

        it('should return proper onConfirm', async () => {
            const { result } = renderHook(() =>
                useSEAccommodationFail(
                    selectedLugMock,
                    selectedSportMock,
                    clearHoldLuggageMock,
                    setSportEquipmentMock,
                    mockTransferFields,
                ),
            );

            const [_fields, onConfirm] = result.current!;

            await onConfirm();

            expect(mockStores.bookingStore.clearSEAccommodationFails).toHaveBeenCalled();
            expect(mockStores.bookingStore.extraLuggage.actualizeLuggageParams).toHaveBeenCalledWith(
                selectedLugMock,
                selectedSportMock,
            );
            expect(mockStores.bookingStore.changeTransfer).toHaveBeenCalledWith(mockAltNoTransfer);
        });
    });

    describe('large sport equipment remove transfer', () => {
        const correspondingFields = mockTransferFields.LargeSERemoveTransferPopup.fields;

        beforeEach(() => {
            mockStores.bookingStore.isLargeSERemoveTransfer = true;
        });

        it('should return proper fields and onCancel callback', () => {
            const { result } = renderHook(() =>
                useSEAccommodationFail(
                    selectedLugMock,
                    selectedSportMock,
                    clearHoldLuggageMock,
                    setSportEquipmentMock,
                    mockTransferFields,
                ),
            );
            const [fields, _onConfirm, onCancel] = result.current!;

            expect(fields).toEqual({
                ...correspondingFields,
                Description: {
                    value: `${correspondingFields.Description.value} ${mockStores.bookingStore.extraLuggage.largeSportEquipmentList}`,
                },
            });

            onCancel();

            expect(setSportEquipmentMock).toHaveBeenCalledWith(
                mockStores.bookingStore.extraLuggage.sportEquipmentPossibleToTransfer,
            );
            expect(mockStores.bookingStore.extraLuggage.confirmExtraLuggage).toHaveBeenCalledWith(
                selectedLugMock,
                mockStores.bookingStore.extraLuggage.sportEquipmentPossibleToTransfer,
                clearHoldLuggageMock,
            );
        });

        it('should return proper onConfirm', async () => {
            const { result } = renderHook(() =>
                useSEAccommodationFail(
                    selectedLugMock,
                    selectedSportMock,
                    clearHoldLuggageMock,
                    setSportEquipmentMock,
                    mockTransferFields,
                ),
            );

            const [_fields, onConfirm] = result.current!;

            await onConfirm();

            expect(mockStores.bookingStore.clearSEAccommodationFails).toHaveBeenCalled();
            expect(mockStores.bookingStore.extraLuggage.actualizeLuggageParams).toHaveBeenCalledWith(
                selectedLugMock,
                selectedSportMock,
            );
            expect(mockStores.bookingStore.changeTransfer).toHaveBeenCalledWith(mockAltNoTransfer);
        });
    });

    describe('transfer not accommodating sport equipment', () => {
        it('should return proper fields when isTransferNotAccommodatingSE is true', () => {
            mockStores.bookingStore.isTransferNotAccommodatingSE = true;

            const correspondingFields = mockTransferFields.TransferNotAccommodatingSEPopup.fields;
            const { result } = renderHook(() =>
                useSEAccommodationFail(
                    selectedLugMock,
                    selectedSportMock,
                    clearHoldLuggageMock,
                    setSportEquipmentMock,
                    mockTransferFields,
                ),
            );
            const [fields] = result.current!;

            expect(fields).toEqual(correspondingFields);
        });
    });
});
