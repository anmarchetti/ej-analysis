import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import { TStores } from 'frontend/store/IStores';
import { SearchBarDropdown, SearchBarDropdownFooterButton } from 'models/enum/SearchBarDropdown';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import SearchPodFooterButtons, { ISearchPodFooterButtonsProps } from './SearchPodFooterButtons';

const mockButtonProps = jest.fn();
jest.mock('frontend/components/common/Button', () => props => {
    mockButtonProps(props);

    return (
        <button className={props.className} onClick={props.onClick} disabled={props.disabled}>
            {props.children}
        </button>
    );
});

const mockUseSearchPodStore = jest.fn();
jest.mock('frontend/components/renderings/SearchPod/stores/createStore', () => ({
    useSearchPodStore: () => mockUseSearchPodStore(),
}));

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const createMockProps = (): ISearchPodFooterButtonsProps => ({
    applyButtonLabel: 'Apply',
    clearButtonLabel: 'Clear',
    isShownClearButton: true,
    onApplyClick: jest.fn(),
    onClearClick: jest.fn(),
    onCloseClick: jest.fn(),
    isApplyButtonDisabled: false,
    mobileLabel: 'Mobile Label',
});

let mockProps;
let mockStores: TStores;

describe('SearchPodFooterButtons', () => {
    beforeEach(() => {
        mockProps = createMockProps();
        mockStores = createMockStores({
            trackingStore: {
                searchPod: {
                    trackFromFooterButtonsClick: jest.fn(),
                    trackToFooterButtonsClick: jest.fn(),
                    trackWhenFooterButtonsClick: jest.fn(),
                    trackWhoFooterButtonsClick: jest.fn(),
                },
            },
        });
        mockUseSearchPodStore.mockReturnValue({ isSearchPodInitialized: false });
    });

    describe('clear button', () => {
        it('should render button wrapper without extra class when isShownClearButton is false', () => {
            mockProps.isShownClearButton = false;
            render(<SearchPodFooterButtons {...mockProps} />);

            expect(screen.getByTestId('clear-button-wrapper')).not.toHaveClass('clearButtonWrapperVisible');
        });

        it('should call onClearClick', () => {
            render(<SearchPodFooterButtons {...mockProps} />);

            fireEvent.click(screen.getByText(mockProps.clearButtonLabel));

            expect(mockProps.onClearClick).toHaveBeenCalled();
        });

        it('should render button wrapper with extra class when isShownClearButton is true', () => {
            render(<SearchPodFooterButtons {...mockProps} />);

            expect(screen.getByTestId('clear-button-wrapper')).toHaveClass('clearButtonWrapperVisible');
        });
    });

    describe('close button', () => {
        it('should render button', () => {
            render(<SearchPodFooterButtons {...mockProps} />);

            expect(screen.getByText(SitecoreDictionary.GlobalsButtonsClose)).toBeInTheDocument();
        });

        it('should call onCloseClick', () => {
            render(<SearchPodFooterButtons {...mockProps} />);

            fireEvent.click(screen.getByText(SitecoreDictionary.GlobalsButtonsClose));

            expect(mockProps.onCloseClick).toHaveBeenCalled();
        });
    });

    describe('apply button', () => {
        it('should render button', () => {
            render(<SearchPodFooterButtons {...mockProps} />);

            expect(screen.getByText(mockProps.applyButtonLabel)).toBeInTheDocument();
        });

        it('should call onApplyClick', () => {
            render(<SearchPodFooterButtons {...mockProps} />);

            fireEvent.click(screen.getByText(mockProps.applyButtonLabel));

            expect(mockProps.onApplyClick).toHaveBeenCalled();
        });

        it('should have disabled attribute and apply disabled styles when isApplyButtonDisabled is true', () => {
            mockProps.isApplyButtonDisabled = true;
            render(<SearchPodFooterButtons {...mockProps} />);

            expect(mockButtonProps).toHaveBeenCalledWith(
                expect.objectContaining({
                    disabled: true,
                    dataTid: 'apply-button',
                }),
            );
        });
    });

    it('should render mobile label', () => {
        render(<SearchPodFooterButtons {...mockProps} />);

        expect(screen.getByText(mockProps.mobileLabel)).toBeInTheDocument();
        expect(screen.getByTestId('search-pod-footer-label')).toBeInTheDocument();
    });

    describe('tracking', () => {
        it('should not call footer buttons click tracking events when fieldName is not provided', () => {
            mockUseSearchPodStore.mockReturnValue({ isSearchPodInitialized: true });
            mockProps.fieldName = undefined;
            render(<SearchPodFooterButtons {...mockProps} />);

            fireEvent.click(screen.getByText(mockProps.applyButtonLabel));
            fireEvent.click(screen.getByText(mockProps.clearButtonLabel));
            fireEvent.click(screen.getByText(SitecoreDictionary.GlobalsButtonsClose));

            expect(mockStores.trackingStore.searchPod.trackFromFooterButtonsClick).not.toHaveBeenCalled();
            expect(mockStores.trackingStore.searchPod.trackToFooterButtonsClick).not.toHaveBeenCalled();
            expect(mockStores.trackingStore.searchPod.trackWhenFooterButtonsClick).not.toHaveBeenCalled();
            expect(mockStores.trackingStore.searchPod.trackWhoFooterButtonsClick).not.toHaveBeenCalled();
        });

        describe('From', () => {
            beforeEach(() => {
                mockUseSearchPodStore.mockReturnValue({ isSearchPodInitialized: true });
                mockProps.fieldName = SearchBarDropdown.From;
            });

            it('should not call trackFromFooterButtonsClick when isSearchPodInitialized is false', () => {
                mockUseSearchPodStore.mockReturnValue({ isSearchPodInitialized: false });

                render(<SearchPodFooterButtons {...mockProps} />);

                fireEvent.click(screen.getByText(mockProps.applyButtonLabel));

                expect(mockStores.trackingStore.searchPod.trackFromFooterButtonsClick).not.toHaveBeenCalled();
            });

            it('should call trackFromFooterButtonsClick with "Apply" when apply button is clicked', () => {
                render(<SearchPodFooterButtons {...mockProps} />);

                fireEvent.click(screen.getByText(mockProps.applyButtonLabel));

                expect(mockStores.trackingStore.searchPod.trackFromFooterButtonsClick).toHaveBeenCalledWith(
                    SearchBarDropdownFooterButton.Apply,
                );
            });

            it('should call trackFromFooterButtonsClick with "Clear" when clear button is clicked', () => {
                render(<SearchPodFooterButtons {...mockProps} />);

                fireEvent.click(screen.getByText(mockProps.clearButtonLabel));

                expect(mockStores.trackingStore.searchPod.trackFromFooterButtonsClick).toHaveBeenCalledWith(
                    SearchBarDropdownFooterButton.Clear,
                );
            });

            it('should call trackFromFooterButtonsClick with "Close" when close button is clicked', () => {
                render(<SearchPodFooterButtons {...mockProps} />);

                fireEvent.click(screen.getByText(SitecoreDictionary.GlobalsButtonsClose));

                expect(mockStores.trackingStore.searchPod.trackFromFooterButtonsClick).toHaveBeenCalledWith(
                    SearchBarDropdownFooterButton.Close,
                );
            });
        });

        describe('To', () => {
            beforeEach(() => {
                mockUseSearchPodStore.mockReturnValue({ isSearchPodInitialized: true });
                mockProps.fieldName = SearchBarDropdown.To;
            });

            it('should not call trackToFooterButtonsClick when isSearchPodInitialized is false', () => {
                mockUseSearchPodStore.mockReturnValue({ isSearchPodInitialized: false });

                render(<SearchPodFooterButtons {...mockProps} />);

                fireEvent.click(screen.getByText(mockProps.applyButtonLabel));

                expect(mockStores.trackingStore.searchPod.trackToFooterButtonsClick).not.toHaveBeenCalled();
            });

            it('should call trackToFooterButtonsClick with "Apply" when apply button is clicked', () => {
                render(<SearchPodFooterButtons {...mockProps} />);

                fireEvent.click(screen.getByText(mockProps.applyButtonLabel));

                expect(mockStores.trackingStore.searchPod.trackToFooterButtonsClick).toHaveBeenCalledWith(
                    SearchBarDropdownFooterButton.Apply,
                );
            });

            it('should call trackToFooterButtonsClick with "Clear" when clear button is clicked', () => {
                render(<SearchPodFooterButtons {...mockProps} />);

                fireEvent.click(screen.getByText(mockProps.clearButtonLabel));

                expect(mockStores.trackingStore.searchPod.trackToFooterButtonsClick).toHaveBeenCalledWith(
                    SearchBarDropdownFooterButton.Clear,
                );
            });

            it('should call trackToFooterButtonsClick with "Close" when close button is clicked', () => {
                render(<SearchPodFooterButtons {...mockProps} />);

                fireEvent.click(screen.getByText(SitecoreDictionary.GlobalsButtonsClose));

                expect(mockStores.trackingStore.searchPod.trackToFooterButtonsClick).toHaveBeenCalledWith(
                    SearchBarDropdownFooterButton.Close,
                );
            });
        });

        describe('When', () => {
            beforeEach(() => {
                mockUseSearchPodStore.mockReturnValue({ isSearchPodInitialized: true });
                mockProps.fieldName = SearchBarDropdown.When;
            });

            it('should not call trackWhenFooterButtonsClick when isSearchPodInitialized is false', () => {
                mockUseSearchPodStore.mockReturnValue({ isSearchPodInitialized: false });

                render(<SearchPodFooterButtons {...mockProps} />);

                fireEvent.click(screen.getByText(mockProps.applyButtonLabel));

                expect(mockStores.trackingStore.searchPod.trackWhenFooterButtonsClick).not.toHaveBeenCalled();
            });

            it('should call trackWhenFooterButtonsClick with "Apply" when apply button is clicked', () => {
                render(<SearchPodFooterButtons {...mockProps} />);

                fireEvent.click(screen.getByText(mockProps.applyButtonLabel));

                expect(mockStores.trackingStore.searchPod.trackWhenFooterButtonsClick).toHaveBeenCalledWith(
                    SearchBarDropdownFooterButton.Apply,
                );
            });

            it('should call trackWhenFooterButtonsClick with "Clear" when clear button is clicked', () => {
                render(<SearchPodFooterButtons {...mockProps} />);

                fireEvent.click(screen.getByText(mockProps.clearButtonLabel));

                expect(mockStores.trackingStore.searchPod.trackWhenFooterButtonsClick).toHaveBeenCalledWith(
                    SearchBarDropdownFooterButton.Clear,
                );
            });

            it('should call trackWhenFooterButtonsClick with "Close" when close button is clicked', () => {
                render(<SearchPodFooterButtons {...mockProps} />);

                fireEvent.click(screen.getByText(SitecoreDictionary.GlobalsButtonsClose));

                expect(mockStores.trackingStore.searchPod.trackWhenFooterButtonsClick).toHaveBeenCalledWith(
                    SearchBarDropdownFooterButton.Close,
                );
            });
        });

        describe('Who', () => {
            beforeEach(() => {
                mockUseSearchPodStore.mockReturnValue({ isSearchPodInitialized: true });
                mockProps.fieldName = SearchBarDropdown.Who;
            });

            it('should not call trackWhenFooterButtonsClick when isSearchPodInitialized is false', () => {
                mockUseSearchPodStore.mockReturnValue({ isSearchPodInitialized: false });

                render(<SearchPodFooterButtons {...mockProps} />);

                fireEvent.click(screen.getByText(mockProps.applyButtonLabel));

                expect(mockStores.trackingStore.searchPod.trackWhoFooterButtonsClick).not.toHaveBeenCalled();
            });

            it('should call trackWhoFooterButtonsClick with "Apply" when apply button is clicked', () => {
                render(<SearchPodFooterButtons {...mockProps} />);

                fireEvent.click(screen.getByText(mockProps.applyButtonLabel));

                expect(mockStores.trackingStore.searchPod.trackWhoFooterButtonsClick).toHaveBeenCalledWith(
                    SearchBarDropdownFooterButton.Apply,
                );
            });

            it('should call trackWhoFooterButtonsClick with "Clear" when clear button is clicked', () => {
                render(<SearchPodFooterButtons {...mockProps} />);

                fireEvent.click(screen.getByText(mockProps.clearButtonLabel));

                expect(mockStores.trackingStore.searchPod.trackWhoFooterButtonsClick).toHaveBeenCalledWith(
                    SearchBarDropdownFooterButton.Clear,
                );
            });

            it('should call trackWhoFooterButtonsClick with "Close" when close button is clicked', () => {
                render(<SearchPodFooterButtons {...mockProps} />);

                fireEvent.click(screen.getByText(SitecoreDictionary.GlobalsButtonsClose));

                expect(mockStores.trackingStore.searchPod.trackWhoFooterButtonsClick).toHaveBeenCalledWith(
                    SearchBarDropdownFooterButton.Close,
                );
            });
        });
    });
});
