using System;
using System.Collections.Generic;
using easyJet.Feature.Tracker.Converters;
using easyJet.Foundation.XConnect.Common.Goals;
using FluentAssertions;
using NSubstitute;
using NSubstitute.ExceptionExtensions;
using Sitecore.Analytics.Model;
using Sitecore.XConnect;
using Xunit;

namespace easyJet.Feature.Tracker.Tests.Converters
{
    public class ConvertHotelDetailsGoalTests
    {
        private readonly ConvertHotelDetailsGoalProxy sut;

        public ConvertHotelDetailsGoalTests()
        {
            sut = new ConvertHotelDetailsGoalProxy();
        }

        [Fact]
        public void CreateEvent_WithValidEventData_CorrectlyPopulatesAndReturnsHotelDetailsEvent()
        {
            // Arrange
            var data = Substitute.ForPartsOf<PageEventData>();
            data.ItemId = Guid.NewGuid(); // passing the check for Guid.Empty

            var idValue = Constants.HotelPageEvent.AccommodationId;
            var nameValue = Constants.HotelPageEvent.Name;
            var ccValue = Constants.HotelPageEvent.CountryCode;
            var locationCodeValue = Constants.HotelPageEvent.LocationCode;
            var themeCodeValue = Constants.HotelPageEvent.ThemeCode;
            var typeCodeValue = Constants.HotelPageEvent.TypeCode;
            var values = new Dictionary<string, object>()
            {
                { Constants.HotelPageEvent.AccommodationId, idValue },
                { Constants.HotelPageEvent.Name, nameValue },
                { Constants.HotelPageEvent.CountryCode, ccValue },
                { Constants.HotelPageEvent.LocationCode, locationCodeValue },
                { Constants.HotelPageEvent.ThemeCode, themeCodeValue },
                { Constants.HotelPageEvent.TypeCode, typeCodeValue }
            };
            data.CustomValues.Returns(values);

            // Act
            var result = sut.CreateEventProxy(data);

            // Assert
            result.Should().NotBeNull();
            if (!(result is HotelDetails castResult))
            {
                false.Should().BeTrue("Result has to be of type HotelDetails rather than base Event.");
                return;
            }

            // string casting below as the values are equally cast during mapping
            castResult.AccommodationId.Should().BeEquivalentTo((string)idValue);
            castResult.Name.Should().BeEquivalentTo((string)nameValue);
            castResult.CountryCode.Should().BeEquivalentTo((string)ccValue);
            castResult.LocationCode.Should().BeEquivalentTo((string)locationCodeValue);
            castResult.ThemeCode.Should().BeEquivalentTo((string)themeCodeValue);
            castResult.HighestPriorityTypeCode.Should().BeEquivalentTo((string)typeCodeValue);

            // and finally checking that the DateTime (UTCNow, assigned during initialization) is in the past.
            castResult.Timestamp.Should().BeBefore(DateTime.UtcNow);
        }

        [Fact]
        public void CreateEvent_WhenCatchingAnException_ReturnsNull()
        {
            // Arrange
            var data = Substitute.ForPartsOf<PageEventData>();
            data.ItemId = Guid.NewGuid(); // passing the check for Guid.Empty
            data.CustomValues.Throws(new Exception());

            // Act
            var result = sut.CreateEventProxy(data);

            // Assert
            result.Should().BeNull();
        }

        [Fact]
        public void CreateEvent_WhenItemIDInEventIsEmpty_ReturnsNull()
        {
            // Arrange
            var data = new PageEventData() { ItemId = Guid.Empty };

            // Act
            var result = sut.CreateEventProxy(data);

            // Assert
            result.Should().BeNull();
        }

        [Fact]
        public void CanProcessPageEventData_WithValidEventData_ReturnsTrue()
        {
            // Arrange
            var dataWithCustomValuesContainingValues = Substitute.ForPartsOf<PageEventData>();
            dataWithCustomValuesContainingValues.PageEventDefinitionId = HotelDetails.HotelPageVisitDefinitionId;
            dataWithCustomValuesContainingValues.CustomValues.Returns(new Dictionary<string, object>() { { "any key", new object() } });

            // Act
            var result = sut.CanProcessPageEventDataProxy(dataWithCustomValuesContainingValues);

            // Assert
            result.Should().BeTrue();
        }

        [Theory]
        [MemberData(nameof(ConvertHotelDetailsGoalTestData.InvalidPageEventData), MemberType = typeof(ConvertHotelDetailsGoalTestData))]
        public void CanProcessPageEventData_WithInvalidEventData_ReturnsFalse(PageEventData data)
        {
            // Arrange

            // Act
            var result = sut.CanProcessPageEventDataProxy(data);

            // Assert
            result.Should().BeFalse();
        }

        internal class ConvertHotelDetailsGoalProxy : ConvertHotelDetailsGoal
        {
            public bool CanProcessPageEventDataProxy(PageEventData data) => base.CanProcessPageEventData(data);

            public Event CreateEventProxy(PageEventData pageEventData) => base.CreateEvent(pageEventData);
        }
    }
}
