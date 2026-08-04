import * as React from 'react';
import classNames from 'classnames';
import { action, makeObservable, observable } from 'mobx';
import { inject, observer } from 'mobx-react';

import { TStores } from 'frontend/store/IStores';
import { ISelectOption } from 'models/data/ISelectOption';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { IComponentWithDictionary } from 'models/sitecore/generic/IComponentWithDictionary';
import Button from 'frontend/components/common/Button';
import Drawer from 'frontend/components/common/Drawer';
import { Tooltip, TooltipContent, TooltipTrigger } from 'frontend/components/common/Tooltip';
import SvgTick from 'frontend/components/icons-new/Tick';

import styles from './OffersSortDrawer.module.scss';

export interface IOffersSortDrawer extends IComponentWithDictionary {
    isOpen: boolean;
    onCancel: () => void;
    onCloseDrawer: (selectedOption: ISelectOption) => void;
    selectedOrderCode: string;
    setSeachPerformWithNewParams: (state: boolean) => void;
    sortOptions: Array<ISelectOption>;
}

@observer
export class OffersSortDrawer extends React.Component<IOffersSortDrawer> {
    constructor(props: IOffersSortDrawer) {
        super(props);
        makeObservable(this);
    }

    // using for control drawer state before applying the filter
    @observable selectedOrder: Nullable<ISelectOption>;

    @action initialize = (): void => {
        this.selectedOrder = {
            label: '',
            value: this.props.selectedOrderCode,
        };
    };

    @action clickOrder = (order: ISelectOption): void => {
        this.selectedOrder = order;
    };

    componentDidUpdate(prevProps): void {
        if (!prevProps.isOpen && this.props.isOpen) {
            this.initialize();
        }

        if (prevProps.isOpen && !this.props.isOpen && prevProps.selectedOrderCode !== this.props.selectedOrderCode) {
            window.scrollTo(0, 0);
        }
    }

    private readonly isActive = (option): boolean =>
        (this.selectedOrder && this.selectedOrder.value == option.value) ||
        (!this.selectedOrder && this.props.selectedOrderCode == option.value);

    private readonly getClassName = (option): string =>
        classNames('drawer__content__list__item', this.isActive(option) && 'active');

    @action clickCancelButton = (): void => {
        this.selectedOrder = null;
        this.props.onCancel();
    };

    @action onClickApplyButton = (): void => {
        if (this.selectedOrder?.value) {
            // check that chosen orderBy different with already applied orderBy else close drawer without refresh list
            this.selectedOrder.value !== this.props.selectedOrderCode
                ? this.props.onCloseDrawer(this.selectedOrder)
                : this.props.onCancel();
            this.selectedOrder = null;
            this.props.setSeachPerformWithNewParams(true);

            return;
        }

        this.selectedOrder = null;
        this.props.onCancel();
    };

    render(): JSX.Element {
        const { getPhrase, isOpen, sortOptions } = this.props;

        return (
            <Drawer open={isOpen}>
                <div className='drawer__content p-0' data-tid='drawer-content'>
                    <div className='drawer__content__title' data-tid='drawer-content-title'>
                        <h4>{getPhrase(SitecoreDictionary.SearchResultsLabelsSortBy)}</h4>

                        <Tooltip>
                            <TooltipTrigger className={styles.iconWrapper} />
                            <TooltipContent
                                text={getPhrase(SitecoreDictionary.SearchResultsLabelsInformationAboutSort)}
                            />
                        </Tooltip>
                    </div>
                    <ul className='drawer__content__list' data-tid='drawer-content-list'>
                        {sortOptions.map((option: ISelectOption) => (
                            <li
                                key={option.value}
                                data-tid={`sort-option-${option.value}`}
                                className={this.getClassName(option)}
                                onClick={() => this.clickOrder(option)}
                            >
                                {option.label}
                                {this.isActive(option) && (
                                    <i className='active-icon' data-tid='active-icon'>
                                        <SvgTick />
                                    </i>
                                )}
                            </li>
                        ))}
                    </ul>
                </div>
                <div className='drawer__actions'>
                    <Button isTransparent isFullWidth onClick={this.clickCancelButton}>
                        {getPhrase(SitecoreDictionary.GlobalsButtonsCancel)}
                    </Button>
                    <Button isFullWidth onClick={this.onClickApplyButton}>
                        {getPhrase(SitecoreDictionary.SearchPodFiltersButtonsApplyAndSeeResults)}
                    </Button>
                </div>
            </Drawer>
        );
    }
}

const ConnectedOffersSortDrawer = inject((stores: TStores) => ({
    getPhrase: stores.layoutStore.getPhrase,
    setSeachPerformWithNewParams: stores.searchStore.setSeachPerformWithNewParams,
}))(OffersSortDrawer);

export default ConnectedOffersSortDrawer;
