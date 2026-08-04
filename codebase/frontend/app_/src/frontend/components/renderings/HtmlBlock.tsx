import * as React from 'react';
import { inject } from 'mobx-react';

import { TStores } from 'frontend/store/IStores';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';

interface IHtmlBlockSitecoreFields {
    Html: ISitecoreField<string>;
}

interface IHtmlBlockSitecoreParams {
    Destinations: string;
    Locations: string;
    Query: string;
}

interface IHtmlBlockProps extends ISitecoreComponent<IHtmlBlockSitecoreFields, IHtmlBlockSitecoreParams> {
    className: string;
    fullUrl: string;
    locations: string[];
    selectedDestinationCodes?: string[];
}

export class HtmlBlock extends React.Component<IHtmlBlockProps> {
    /**
     * Compare two strings. Comparing lowercase string with replacing "-" to empty space.
     */
    private replaceSpecificChars = (val: string) => (val || '').toLowerCase().replace(/-/g, '');

    /**
     * Compare to strings. Strings shouldn't be null.
     */
    private compareStrings = (val1: string, val2: string) =>
        !!val1 && !!val2 && this.replaceSpecificChars(val1) === this.replaceSpecificChars(val2);

    /** HTML block visibility */
    get shouldShow() {
        const destinations = this.props.selectedDestinationCodes || [];
        const hasHtml = !!this.props.fields?.Html;

        /** If no params specified then just check htm availability */
        if (!this.props.params?.Locations && !this.props.params?.Destinations && !this.props.params?.Query) {
            return hasHtml;
        }

        const locationsToCheck = (this.props.params?.Locations || '').split('|');
        const destinationsToCheck = (this.props.params?.Destinations || '').split('|');

        /** Check if locations from url match */
        const containsLocations = this.props.locations.some(el =>
            locationsToCheck.some(l => this.compareStrings(l, el)),
        );
        /** Check if destinations match */
        const containsDestinations = destinations.some(el => destinationsToCheck.some(d => this.compareStrings(d, el)));
        /** Check if query match */
        const containsQuery = this.props.params?.Query && this.props.fullUrl.indexOf(this.props.params?.Query) > -1;

        return hasHtml && (containsLocations || containsDestinations || containsQuery);
    }

    render() {
        return this.shouldShow && this.props.fields?.Html?.value ? (
            <div className={this.props.className} dangerouslySetInnerHTML={{ __html: this.props.fields.Html.value }} />
        ) : null;
    }
}

const ConnectedHtmlBlock = inject((stores: TStores) => ({
    locations: (stores.layoutStore.currentPath || '').split('/'),
    selectedDestinationCodes: stores.searchStore.searchTo.selectedDestinationCodes,
    fullUrl: stores.layoutStore.fullUrl,
}))(HtmlBlock);

export default ConnectedHtmlBlock;
