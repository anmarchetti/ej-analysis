import * as React from 'react';
import { inject } from 'mobx-react';

import { IReviewsData } from 'frontend/store/base';
import { TStores } from 'frontend/store/IStores';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { IComponentWithDictionary } from 'models/sitecore/generic/IComponentWithDictionary';
import Button from 'frontend/components/common/Button';
import Drawer from 'frontend/components/common/Drawer';
import TaLogoPrimary from 'frontend/components/icons-new/TaLogoPrimary';

import ReviewsList from './ReviewsList';

interface IReviewsDrawerProps extends IComponentWithDictionary {
    isExpanded: boolean;
    onClose: () => void;
    reviewsData: IReviewsData;
    showLessMobileRef: React.RefObject<HTMLDivElement>;
}

export const ReviewsDrawer = (props: IReviewsDrawerProps) => (
    <Drawer open={props.isExpanded}>
        <div className='row'>
            <div
                className='drawer__header col-12 px-4 pt-4 d-flex flex-row align-items-center'
                ref={props.showLessMobileRef}
            >
                <TaLogoPrimary className='me-2' />
                <h4 className='m-0'>{props.getPhrase(SitecoreDictionary.HotelReviewsLabelsReviews)}</h4>
            </div>
            <div className='col-12 px-4 mb-3 pb-5'>
                <ReviewsList reviewsData={props.reviewsData} isExpanded={props.isExpanded} />
            </div>
            <div className='drawer__actions'>
                <Button isTransparent isFullWidth onClick={props.onClose} dataTid='close-btn'>
                    {props.getPhrase(SitecoreDictionary.GlobalsButtonsClose)}
                </Button>
            </div>
        </div>
    </Drawer>
);

const ConnectedReviewsDrawer = inject((stores: TStores) => ({
    getPhrase: stores.layoutStore.getPhrase,
}))(ReviewsDrawer);

export default ConnectedReviewsDrawer;
