using System;
using System.Linq;
using System.Runtime.CompilerServices;
using System.Web.Mvc;
using easyJet.Feature.Tracker.Logging;
using easyJet.Foundation.Analytics.Services;
using easyJet.Foundation.Destinations.Services;
using easyJet.Foundation.XConnect.Common.Goals;
using Sitecore;
using Sitecore.Analytics.Model;
using Sitecore.Data.Items;
using Sitecore.Marketing.Definitions.Goals;
using Sitecore.Pipelines.HttpRequest;
using Sitecore.Web;

[assembly: InternalsVisibleTo("easyJet.Feature.Tracker.Tests")]
[assembly: InternalsVisibleTo("DynamicProxyGenAssembly2")]

namespace easyJet.Feature.Tracker.Pipelines.HotelAnalytics
{
    public class HotelPageInteractionProcessor : HttpRequestProcessor
    {
        private readonly ITrackerLogger logger;
        private readonly ITrackerProvider trackerProvider;

        public HotelPageInteractionProcessor(ITrackerLogger logger, ITrackerProvider trackerProvider)
        {
            this.logger = logger;
            this.trackerProvider = trackerProvider;
        }

        public override void Process(HttpRequestArgs args)
        {
            if (trackerProvider?.CurrentTracker == null)
            {
                return;
            }

            var currentPageItem = GetContextItem();

            if (currentPageItem == null)
            {
                return;
            }

            var isHotelPageApiRenderRequest = currentPageItem.TemplateID.Equals(Constants.TemplateIds.HotelDetailsPage);

            if (!currentPageItem.TemplateID.Equals(Constants.TemplateIds.HotelPage) && !isHotelPageApiRenderRequest)
            {
                return;
            }

            try
            {
                var destinationsSearchService = ResolveDestinationsSearchService();

                // In case if hotel is render from api call get hotel code from query
                // else use current context item
                var hotelId = isHotelPageApiRenderRequest
                    ? WebUtil.GetQueryString(Constants.QueryParams.AccommodationId)
                    : currentPageItem.Fields[Constants.HotelItemFields.CodeKey].Value;

                var hotel = destinationsSearchService.GetHotelsByAtcomCodes(new[] { hotelId })?.FirstOrDefault();

                if (hotel == null)
                {
                    logger.Error($"{nameof(HotelPageInteractionProcessor)} cannot find a hotel by id {hotelId}", this);
                    return;
                }

                var goalData = GetGoalData();

                // If goal already registered update with custom data
                // else create new page goal event
                if (goalData != null)
                {
                    goalData.CustomValues.Add(Constants.HotelPageEvent.AccommodationId, hotel.Code);
                    goalData.CustomValues.Add(Constants.HotelPageEvent.Name, hotel.Name);
                    goalData.CustomValues.Add(Constants.HotelPageEvent.CountryCode, hotel.Country?.Code);
                    goalData.CustomValues.Add(Constants.HotelPageEvent.LocationCode, hotel.Location?.Code);
                    goalData.CustomValues.Add(Constants.HotelPageEvent.ThemeCode, hotel.HotelTheme?.Code);
                    goalData.CustomValues.Add(Constants.HotelPageEvent.TypeCode, hotel.HighestPriorityType?.Code);
                }
                else
                {
                    var ev = GetGoalDefinition();

                    if (ev == null)
                    {
                        return;
                    }

                    var pageData = new Sitecore.Analytics.Data.PageEventData(ev.Alias, ev.Id);
                    pageData.CustomValues.Add(Constants.HotelPageEvent.AccommodationId, hotel.Code);
                    pageData.CustomValues.Add(Constants.HotelPageEvent.Name, hotel.Name);
                    pageData.CustomValues.Add(Constants.HotelPageEvent.CountryCode, hotel.Country?.Code);
                    pageData.CustomValues.Add(Constants.HotelPageEvent.LocationCode, hotel.Location?.Code);
                    pageData.CustomValues.Add(Constants.HotelPageEvent.ThemeCode, hotel.HotelTheme?.Code);
                    pageData.CustomValues.Add(Constants.HotelPageEvent.TypeCode, hotel.HighestPriorityType?.Code);

                    RegisterPageEventData(pageData);
                }
            }
            catch (Exception exception)
            {
                logger.Error($"{nameof(HotelPageInteractionProcessor)} cannot register event for: hotel {currentPageItem.ID}", exception, this);
            }
        }

        internal virtual PageEventData RegisterPageEventData(Sitecore.Analytics.Data.PageEventData pageData) =>
            Sitecore.Analytics.Tracker.Current.CurrentPage.Register(pageData);

        internal virtual IGoalDefinition GetGoalDefinition() =>
            Sitecore.Analytics.Tracker.MarketingDefinitions.Goals[HotelDetails.HotelPageVisitDefinitionId];

        internal virtual PageEventData GetGoalData() =>
            Sitecore.Analytics.Tracker.Current.CurrentPage.PageEvents.FirstOrDefault(e => e.PageEventDefinitionId == HotelDetails.HotelPageVisitDefinitionId);

        internal virtual IDestinationsSearchService ResolveDestinationsSearchService() =>
            DependencyResolver.Current.GetService<IDestinationsSearchService>();

        internal virtual Item GetContextItem() => Context.Item;
    }
}