import * as React from 'react';
import classNames from 'classnames';
import { inject } from 'mobx-react';
import scrollIntoViewIfNeeded from 'scroll-into-view-if-needed';

import marketStore from 'frontend/store/base/market/MarketStore';
import { TStores } from 'frontend/store/IStores';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { IComponentWithDictionary } from 'models/sitecore/generic/IComponentWithDictionary';
import { STICKY_BOX_ID } from 'frontend/components/common/StickyBox';
import TripadvisorRating from 'frontend/components/common/TripadvisorRating/TripadvisorRating';

interface ITripadvisorInfoProps extends IComponentWithDictionary {
    getFormattedNumber: marketStore['getFormattedNumber'];
    rating: number;
    reviews: number;
    className?: string;
    reviewsAnchor?: string;
}

class TripadvisorInfo extends React.Component<ITripadvisorInfoProps> {
    componentDidMount() {
        if (this.props.reviewsAnchor) {
            document.addEventListener('scroll', this.scrollStickyBoxHeight);
        }
    }

    componentWillUnmount() {
        if (this.props.reviewsAnchor) {
            document.removeEventListener('scroll', this.scrollStickyBoxHeight);
        }
    }

    /**For not showing sticky box in front of tripadvisor block - EJH-8353 */
    scrollStickyBoxHeight = () => {
        if (!this.props.reviewsAnchor) {
            return;
        }

        const element = document.getElementById(this.props.reviewsAnchor);
        const boundingRect = element?.getBoundingClientRect();

        if (boundingRect && Math.floor(boundingRect.top) == 0) {
            const stickyBox = document.getElementById(STICKY_BOX_ID);

            if (stickyBox) {
                const scrolledHeight = window.scrollY || document.documentElement.scrollTop;

                window.scrollTo(0, scrolledHeight - stickyBox.offsetHeight);
            }
        }
    };

    scrollToElement = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
        e.preventDefault();

        if (!this.props.reviewsAnchor) {
            return;
        }

        const element = document.getElementById(this.props.reviewsAnchor);

        if (element) {
            scrollIntoViewIfNeeded(element, {
                behavior: 'smooth',
                block: 'start',
            });
        }
    };

    get content() {
        const reviewText =
            this.props.getFormattedNumber(this.props.reviews) +
            ' ' +
            this.props.getPhrase(
                this.props.reviews !== 1
                    ? SitecoreDictionary.HotelReviewsLabelsReviewItemPlural
                    : SitecoreDictionary.HotelReviewsLabelsReviewItemSingular,
            );

        return (
            <>
                <TripadvisorRating hasIcon rating={this.props.rating} />
                <div className='tripadvisor-reviews'>{reviewText}</div>
            </>
        );
    }

    render() {
        return (
            <div className={classNames('hotel-reviews', this.props.className)}>
                {!!this.props.reviewsAnchor ? (
                    <a href={`#${this.props.reviewsAnchor}`} onClick={this.scrollToElement}>
                        {this.content}
                    </a>
                ) : (
                    this.content
                )}
            </div>
        );
    }
}

export default inject((stores: TStores) => ({
    getPhrase: stores.layoutStore.getPhrase,
    getFormattedNumber: stores.marketStore.getFormattedNumber,
}))(TripadvisorInfo);
