using System;
using System.Collections.Generic;
using easyJet.Foundation.XConnect.Common.Goals;
using NSubstitute;
using Sitecore.Analytics.Model;

namespace easyJet.Feature.Tracker.Tests.Converters
{
    public class ConvertHotelDetailsGoalTestData
    {
        public static IEnumerable<object[]> InvalidPageEventData()
        {
            yield return new[] { new PageEventData() { PageEventDefinitionId = Guid.NewGuid() } };

            yield return new[] { new PageEventData() { PageEventDefinitionId = HotelDetails.HotelPageVisitDefinitionId } };

            var dataWithCustomValuesInitialized = Substitute.ForPartsOf<PageEventData>();
            dataWithCustomValuesInitialized.PageEventDefinitionId = HotelDetails.HotelPageVisitDefinitionId;
            dataWithCustomValuesInitialized.CustomValues.Returns(new Dictionary<string, object>());

            yield return new[] { dataWithCustomValuesInitialized };
        }
    }
}