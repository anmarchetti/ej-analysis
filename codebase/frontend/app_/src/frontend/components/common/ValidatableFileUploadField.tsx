import React, { Component } from 'react';
import { action, computed, makeObservable, observable } from 'mobx';
import { inject, observer } from 'mobx-react';

import { TStores } from 'frontend/store/IStores';
import { IValidationError } from 'models/data/validation/IValidationError';
import { FileType } from 'models/enum/FileType';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { ValidationType } from 'models/enum/ValidationType';
import { IComponentWithDictionary } from 'models/sitecore/generic/IComponentWithDictionary';
import Button from 'frontend/components/common/Button';
import SVGCross from 'frontend/components/icons-new/Cross';
import SvgPlus from 'frontend/components/icons-new/Plus';
import SvgWarningFilled from 'frontend/components/icons-new/WarningFilled';
import SvgWarningFilledTransparent from 'frontend/components/icons-new/WarningFilledTransparent';

export interface IFileUploadProps extends IComponentWithDictionary {
    allowedUploadedFileNumb: number; //should be counting number
    errors: IValidationError[];
    files: Nullable<File[]>;
    id: string;
    label: string;
    onChange: (files: Nullable<File[]>) => void;
    acceptFileTypes?: FileType[];
    errorLabel?: string;
    forceError?: boolean;
    isTradePortal?: boolean;
    multiple?: boolean;
    required?: boolean;
    successMessage?: string;
}

@observer
export class ValidatableFileUploadField extends Component<IFileUploadProps> {
    constructor(props: IFileUploadProps) {
        super(props);
        makeObservable(this);
    }

    componentDidUpdate(prevProps: IFileUploadProps) {
        if (this.hasErrors && this.props.files) {
            this.toggleIsShowError(true);
            this.props.onChange(prevProps.files);
        }
    }

    @observable private isBlurred: boolean = false;
    @observable private isShowError: boolean = false;

    @computed private get fieldErrors(): IValidationError[] {
        if (this.props.forceError) {
            return this.props.errors;
        }

        if (this.props.errors?.length) {
            return this.props.errors.filter(el => el.trigger === ValidationType.OnBlur && this.isBlurred);
        }

        return [];
    }

    @computed private get hasErrors() {
        return !!this.fieldErrors.length;
    }

    @action toggleIsBlurred = (state: boolean) => {
        this.isBlurred = state;
    };

    @action toggleIsShowError = (state: boolean) => {
        this.isShowError = state;
    };

    @action onFileClick = () => {
        document.body.addEventListener('focusin', this.onBodyFocus);
    };

    // Event fires on closing browser window 'Choose a file'
    @action onBodyFocus = () => {
        this.toggleIsBlurred(true);
        document.body.removeEventListener('focusin', this.onBodyFocus);
    };

    @action onDropFile = (event: React.ChangeEvent<HTMLInputElement>) => {
        this.toggleIsShowError(false);
        const uploadedFiles = event.target.files;
        const files = uploadedFiles
            ? [...(this.props.files || []), ...Array.prototype.slice.call(uploadedFiles)]
            : this.props.files;
        this.props.onChange(files);
    };

    @action onRemoveFile = (fileIndex: number, e?: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        e?.preventDefault();
        this.toggleIsShowError(false);
        const files = this.props.files?.filter((e, index) => index !== fileIndex);
        this.props.onChange(files?.length ? files : null);
    };

    renderFileInput() {
        const accept = this.props.acceptFileTypes ? this.props.acceptFileTypes.join(',') : undefined;

        return (
            <div className='file-upload__control'>
                <input
                    type='file'
                    id={this.props.id}
                    onChange={this.onDropFile}
                    onClick={this.onFileClick}
                    accept={accept}
                    multiple
                    required
                />
                <label className='file-upload__btn' htmlFor={this.props.id}>
                    {this.props.label}
                </label>
            </div>
        );
    }

    renderFilePills() {
        const { files, allowedUploadedFileNumb } = this.props;

        return (
            <>
                {this.props.successMessage && <div className='file-upload__success'>{this.props.successMessage}</div>}
                <div className='file-upload__files' data-tid={this.props.id}>
                    {this.props.files?.map((file, index) => (
                        <div key={index} className='file-upload__file'>
                            <span className='file-upload__file__name'>{file.name}</span>
                            <Button
                                type='button'
                                isText
                                onClick={e => this.onRemoveFile(index, e)}
                                aria-label={this.props.getPhrase(SitecoreDictionary.GlobalsButtonsRemove)}
                            >
                                <SVGCross />
                            </Button>
                        </div>
                    ))}
                    {files && files.length < allowedUploadedFileNumb && (
                        <div className='file-upload__icon-control'>
                            <input
                                type='file'
                                id='icon-control'
                                onChange={this.onDropFile}
                                multiple={this.props.multiple}
                                accept={this.props.acceptFileTypes ? this.props.acceptFileTypes.join(',') : undefined}
                            />
                            <label className='file-upload__icon' htmlFor='icon-control'>
                                <SvgPlus />
                            </label>
                        </div>
                    )}
                </div>
            </>
        );
    }

    render() {
        return (
            <div className='file-upload'>
                {this.props.files?.length && !this.hasErrors ? this.renderFilePills() : this.renderFileInput()}

                {(this.hasErrors || this.isShowError) && (
                    <div className='form-control__error'>
                        <i className='form-control__error__icon'>
                            {this.props.isTradePortal ? <SvgWarningFilledTransparent /> : <SvgWarningFilled />}
                        </i>
                        <span className='form-control__error__label'>
                            {this.props.isTradePortal
                                ? this.props.errorLabel
                                : this.props.getPhrase(SitecoreDictionary.PricePromiseErrorsScreenshotInvalid)}
                        </span>
                    </div>
                )}
            </div>
        );
    }
}

export default inject((stores: TStores) => ({
    getPhrase: stores.layoutStore.getPhrase,
    isTradePortal: stores.layoutStore.isTradePortal,
}))(ValidatableFileUploadField);
