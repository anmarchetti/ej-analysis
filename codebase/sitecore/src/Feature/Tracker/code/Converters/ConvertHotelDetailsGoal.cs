using System;
using System.Linq;
using easyJet.Feature.Tracker.Pipelines.HotelAnalytics;
using easyJet.Foundation.XConnect.Common.Goals;
using Sitecore.Analytics.Model;
using Sitecore.Analytics.XConnect.DataAccess.Pipelines.ConvertToXConnectEventPipeline;
using Sitecore.Diagnostics;
using Sitecore.Framework.Conditions;
using Sitecore.XConnect;

namespace easyJet.Feature.Tracker.Converters
{
    public class ConvertHotelDetailsGoal : ConvertPageEventDataToEventBase
    {
        protected override bool CanProcessPageEventData(PageEventData pageEventData)
        {
            Condition.Requires(pageEventData, nameof(pageEventData)).IsNotNull();

            return pageEventData.PageEventDefinitionId == HotelDetails.HotelPageVisitDefinitionId && pageEventData.CustomValues != null && pageEventData.CustomValues.Any();
        }

        protected override Event CreateEvent(PageEventData pageEventData)
        {
            if (pageEventData.ItemId == Guid.Empty)
            {
                return null;
            }

            try
            {
                var hotelDetailsGoal = new HotelDetails(DateTime.UtcNow)
                {
                    AccommodationId = (string)pageEventData.CustomValues[Constants.HotelPageEvent.AccommodationId],
                    Name = (string)pageEventData.CustomValues[Constants.HotelPageEvent.Name],
                    CountryCode = (string)pageEventData.CustomValues[Constants.HotelPageEvent.CountryCode],
                    LocationCode = (string)pageEventData.CustomValues[Constants.HotelPageEvent.LocationCode],
                    ThemeCode = (string)pageEventData.CustomValues[Constants.HotelPageEvent.ThemeCode],
                    HighestPriorityTypeCode = (string)pageEventData.CustomValues[Constants.HotelPageEvent.TypeCode],
                };

                return hotelDetailsGoal;
            }
            catch (Exception exception)
            {
                Log.Error($"{nameof(HotelPageInteractionProcessor)} cannot add interaction for hotel {pageEventData.ItemId}", exception, this);
                return null;
            }
        }
    }
}