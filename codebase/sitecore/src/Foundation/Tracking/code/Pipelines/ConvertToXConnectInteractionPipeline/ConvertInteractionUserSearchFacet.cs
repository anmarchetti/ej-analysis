using easyJet.Foundation.PushNotifications.Facets;
using easyJet.Foundation.Tracking.Extenstions;
using Sitecore.Analytics.XConnect.DataAccess.Pipelines.ConvertToXConnectInteractionPipeline;

namespace easyJet.Foundation.Tracking.Pipelines.ConvertToXConnectInteractionPipeline
{
    public class ConvertInteractionUserSearchFacet : ConvertToXConnectInteractionProcessorBase
    {
        public override void Process(ConvertToXConnectInteractionPipelineArgs args)
        {
            if (args != null)
            {
                var customValues = args.TrackerVisitData.CustomValues;
                if (customValues.TryGetValueAs(UserSearches.DefaultFacetKey, out UserSearches userSearches) && userSearches != null)
                {
                    args.Facets.Add(UserSearches.DefaultFacetKey, userSearches);
                }
            }
        }
    }
}