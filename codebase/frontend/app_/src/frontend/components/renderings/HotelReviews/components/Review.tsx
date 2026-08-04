import * as React from 'react';
import classNames from 'classnames';
import { inject } from 'mobx-react';

import { DATE_FORMATS } from 'code/dates';
import { TStores } from 'frontend/store/IStores';
import { formatDateL10n } from 'frontend/utils/date.utils';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { IComponentWithDictionary } from 'models/sitecore/generic/IComponentWithDictionary';
import TripadvisorRating from 'frontend/components/common/TripadvisorRating/TripadvisorRating';

export interface IReview {
    author: string;
    publishedDate: string;
    ratingNum: number;
    text: string;
    title: string;
}
interface IReviewProps extends IReview, IComponentWithDictionary {}

interface IReviewState {
    isExpanded: boolean;
    isInitial: boolean;
}

export class Review extends React.Component<IReviewProps, IReviewState> {
    private refText: React.RefObject<HTMLDivElement> = React.createRef();

    private shortReview: string = this.props.text.length ? `"${this.props.text}"` : '';
    private fullReview: string = this.props.text.length ? `"${this.props.text}"` : '';

    state = {
        isExpanded: false,
        isInitial: true,
    };

    componentDidMount() {
        if (this.props.text.length && this.refText.current) {
            this.ellipsize(this.refText.current);
        }

        this.setState({ isInitial: false });
    }

    private ellipsize(el: any) {
        const wordArray = el.textContent.split(' ');

        if (el.scrollHeight <= el.offsetHeight) {
            return;
        }

        while (el.scrollHeight > el.offsetHeight) {
            wordArray.pop();
            el.innerHTML = wordArray.join(' ');
        }
        wordArray.splice(-9, 9);
        this.shortReview = wordArray.join(' ');
    }

    showFullReview(e: React.MouseEvent<HTMLAnchorElement, MouseEvent>, isExpanded: boolean) {
        e.preventDefault();
        this.setState({ isExpanded });
    }

    render() {
        const props = this.props;

        return (
            <div className='tripadvisor-review'>
                <div className='separator' />
                <h4 className='m-0 mt-4 mb-3'>{props.title}</h4>
                <div className='tripadvisor-review__subheading d-flex'>
                    <TripadvisorRating customClass='me-2' rating={props.ratingNum} />
                    <div className='tripadvisor-review__subheading--date'>
                        {formatDateL10n(props.publishedDate, DATE_FORMATS.DayMonthShortYear)}
                    </div>
                    {!!props.author.length && (
                        <>
                            <div className='tripadvisor-review__subheading--separator ms-2 me-2'>|</div>
                            <div className='tripadvisor-review__subheading--author'>{props.author}</div>
                        </>
                    )}
                </div>
                <div className='tripadvisor-review__content mt-3 mb-4'>
                    <p className={classNames('m-0', this.state.isInitial && 'in-progress')}>
                        <span ref={this.refText}>
                            {this.state.isExpanded || this.state.isInitial ? this.fullReview : this.shortReview}
                        </span>
                        {this.fullReview.length !== this.shortReview.length &&
                            (this.state.isExpanded ? (
                                <a
                                    className='tripadvisor-review__content--close'
                                    onClick={e => this.showFullReview(e, false)}
                                    href='#'
                                >
                                    &nbsp;{props.getPhrase(SitecoreDictionary.HotelReviewsLabelsReadLessReview)}
                                </a>
                            ) : (
                                <a
                                    className='tripadvisor-review__content--open'
                                    onClick={e => this.showFullReview(e, true)}
                                    href='#'
                                >
                                    ... {props.getPhrase(SitecoreDictionary.HotelReviewsLabelsReadFullReview)}
                                </a>
                            ))}
                    </p>
                </div>
                <div className='separator bottom-line' />
            </div>
        );
    }
}

const ConnectedReview = inject((stores: TStores) => ({
    getPhrase: stores.layoutStore.getPhrase,
}))(Review);

export default ConnectedReview;
