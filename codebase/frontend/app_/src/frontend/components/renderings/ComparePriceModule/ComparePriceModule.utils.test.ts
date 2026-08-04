import { NewOfferState } from 'frontend/store/base';
import { mockSitecoreField } from 'frontend/utils/tests.utils';

import { IComparePriceModuleFields } from './components/ComparePriceContent/ComparePriceContent.utils';
import { getInfoPopupProps, IInfoPopupProps } from './ComparePriceModule.utils';

describe('ComparePrice.utils', () => {
    describe('getInfoPopupProps', () => {
        const props: IInfoPopupProps = {
            fields: {
                ErrorPopupIcon: mockSitecoreField({ src: 'ErrorPopupIcon' }),
                ErrorPopupSubtitle: mockSitecoreField('ErrorPopupSubtitle'),
                ErrorPopupTitle: mockSitecoreField('ErrorPopupTitle'),
                LoadingErrorPopupSubtitle: mockSitecoreField('LoadingErrorPopupSubtitle'),
                LoadingErrorPopupTitle: mockSitecoreField('LoadingErrorPopupTitle'),
                ConfirmationPopupIcon: mockSitecoreField({ src: 'ConfirmationPopupIcon' }),
                ConfirmationPopupSubtitle: mockSitecoreField('ConfirmationPopupSubtitle'),
                ConfirmationPopupTitle: mockSitecoreField('ConfirmationPopupTitle'),
            } as IComparePriceModuleFields,
            isLoading: false,
            setNewOfferState: jest.fn(),
            newOfferState: NewOfferState.NoChange,
            isLoadingError: false,
            setIsLoadingError: jest.fn(),
        };

        it('should return default data', () => {
            const data = getInfoPopupProps(props);

            expect(data).toStrictEqual(
                expect.objectContaining({
                    shouldShow: false,
                    onClose: expect.any(Function),
                    type: 'error',
                    subtitle: props.fields.LoadingErrorPopupSubtitle,
                    title: props.fields.LoadingErrorPopupTitle,
                    icon: props.fields.ErrorPopupIcon,
                    isSmall: true,
                }),
            );
        });

        it('should return specific data when isLoadingError is true', () => {
            const data = getInfoPopupProps({ ...props, isLoadingError: true });

            expect(data).toStrictEqual(
                expect.objectContaining({
                    shouldShow: true,
                    onClose: expect.any(Function),
                    type: 'error',
                    subtitle: props.fields.LoadingErrorPopupSubtitle,
                    title: props.fields.LoadingErrorPopupTitle,
                    icon: props.fields.ErrorPopupIcon,
                    isSmall: true,
                }),
            );
        });

        it('should return specific data when isLoading is false and newOfferState is Accepted', () => {
            const data = getInfoPopupProps({ ...props, newOfferState: NewOfferState.Accepted });

            expect(data).toStrictEqual({
                icon: props.fields.ConfirmationPopupIcon,
                onClose: expect.any(Function),
                shouldShow: true,
                subtitle: props.fields.ConfirmationPopupSubtitle,
                title: props.fields.ConfirmationPopupTitle,
                type: 'confirm',
            });
        });

        it('should return specific data when isLoading is false and newOfferState is Error', () => {
            const data = getInfoPopupProps({ ...props, newOfferState: NewOfferState.Error });

            expect(data).toStrictEqual({
                onClose: expect.any(Function),
                shouldShow: true,
                subtitle: props.fields.ErrorPopupSubtitle,
                title: props.fields.ErrorPopupTitle,
                icon: props.fields.ErrorPopupIcon,
                type: 'error',
                isSmall: true,
            });
        });
    });
});
