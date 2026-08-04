import React, { Component } from 'react';
import { inject } from 'mobx-react';

import { Tokens } from 'code/tokens';
import { IHolidaysStores } from 'frontend/store/holidays';
import { Tokenizer } from 'frontend/utils/tokenizer';
import { IOffer } from 'models/data/IOffer';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { IComponentWithDictionary } from 'models/sitecore/generic/IComponentWithDictionary';
import Button from 'frontend/components/common/Button';
import ErrorMessage from 'frontend/components/common/ErrorMessage';
import { Popup } from 'frontend/components/common/Popup';
import SvgWarningFilled from 'frontend/components/icons-new/WarningFilled';
export interface IShortlistRemovePopupProps extends IComponentWithDictionary {
    isRemoveShortlistFailed: boolean;
    isShortlistRemoving: boolean;
    offers: IOffer[];
    onClose: () => void;
    onRemove: () => void;
}

export class ShortlistRemovePopup extends Component<IShortlistRemovePopupProps> {
    get title(): string {
        if (this.props.offers.length > 1) {
            return Tokenizer.replaceToken(
                this.props.getPhrase(SitecoreDictionary.ShortlistRemoveHolidayPopupLabelsRemoveHolidaysPlural),
                Tokens.Number,
                this.props.offers.length.toString(),
            );
        }

        return this.props.getPhrase(SitecoreDictionary.ShortlistRemoveHolidayPopupLabelsRemoveHolidaySingular);
    }

    get bodyContent() {
        const hotelName = this.props.offers.length === 1 && this.props.offers[0].hotel?.name;

        if (hotelName) {
            return `‘${hotelName}’`;
        }

        return null;
    }

    get footerContent() {
        return (
            <>
                <Button
                    isMd
                    isLoading={this.props.isShortlistRemoving}
                    disabled={this.props.isRemoveShortlistFailed}
                    onClick={() => this.onRemove()}
                >
                    {this.props.getPhrase(SitecoreDictionary.GlobalsButtonsRemove)}
                </Button>
                <Button isMd isTransparent onClick={() => this.onClose()}>
                    {this.props.getPhrase(SitecoreDictionary.GlobalsButtonsCancel)}
                </Button>
            </>
        );
    }

    onClose = (): void => {
        this.props.onClose();
    };

    onRemove = (): void => {
        this.props.onRemove();
    };

    render() {
        return (
            <Popup
                isSmall
                title={this.title}
                footerContent={this.footerContent}
                containerClass='remove-shortlist-popup'
            >
                {this.bodyContent}
                {this.props.isRemoveShortlistFailed && (
                    <ErrorMessage
                        message={this.props.getPhrase(SitecoreDictionary.ShortlistErrorsGenericMessage)}
                        description={this.props.getPhrase(SitecoreDictionary.ShortlistErrorsGenericDescription)}
                        errorMessageClass='error-container error mt-3 mb-0 text-start'
                        icon={
                            <i className='error-message__icon'>
                                <SvgWarningFilled />
                            </i>
                        }
                    />
                )}
            </Popup>
        );
    }
}

export default inject((stores: IHolidaysStores) => ({
    getPhrase: stores.layoutStore.getPhrase,
    isShortlistRemoving: stores.shortlistStore.isShortlistRemoving,
    isRemoveShortlistFailed: stores.shortlistStore.isRemoveShortlistFailed,
}))(ShortlistRemovePopup);
