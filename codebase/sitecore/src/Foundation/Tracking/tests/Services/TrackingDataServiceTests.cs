using System;
using AutoFixture.Xunit2;
using easyJet.Foundation.Analytics.Services;
using easyJet.Foundation.PushNotifications.Facets;
using easyJet.Foundation.Tracking.Logging;
using easyJet.Foundation.Tracking.Models.Requests;
using easyJet.Foundation.Tracking.Services;
using FluentAssertions;
using NSubstitute;
using Sitecore.XConnect;
using Sitecore.XConnect.Serialization;
using Xunit;
using XdbUnavailableException = Sitecore.Analytics.DataAccess.XdbUnavailableException;

namespace easyJet.Foundation.Tracking.Tests.Services
{
    public class TrackingDataServiceTests
    {
        private readonly IContactService contactService;
        private readonly TrackingDataService service;
        private readonly ITrackingLogger logger;

        public TrackingDataServiceTests()
        {
            contactService = Substitute.For<IContactService>();
            logger = Substitute.For<ITrackingLogger>();
            service = Substitute.ForPartsOf<TrackingDataService>(contactService, logger);
        }

        [Theory]
        [AutoData]
        public void Get_ShouldGetTrackingData_IfContactExists(Guid contactId, TrackingData expectedTrackingData)
        {
            // Arrange
            var contact = new Contact(new ContactIdentifier("new", contactId.ToString(), ContactIdentifierType.Known));
            DeserializationHelpers.SetFacet(contact, TrackingData.DefaultFacetKey, expectedTrackingData);

            var client = Substitute.For<IXdbContext>();
            service.When(x => x.GetClient()).DoNotCallBase();
            service.GetClient().Returns(client);

            service.GetCurrentTrackerContact(Arg.Any<IXdbContext>(), Arg.Any<string>()).Returns(contact);

            // Act
            var actual = service.Get();

            // Assert
            actual.AccommodationId.Should().Be(expectedTrackingData.AccommodationId);
            actual.Endpoint.Should().Be(expectedTrackingData.Endpoint);
        }

        [Theory]
        [AutoData]
        public void Update_ShouldUpdateTrackingData_IfContactExists(Contact contact, TrackingHotelDataRequest expectedTrackingData)
        {
            // Arrange
            var client = Substitute.For<IXdbContext>();

            service.When(x => x.GetClient()).DoNotCallBase();
            service.When(x => x.SetContactFacet(Arg.Any<IXdbContext>(), Arg.Any<Contact>(), Arg.Any<TrackingData>(), Arg.Any<string>())).DoNotCallBase();
            service.GetClient().Returns(client);
            service.GetCurrentTrackerContact(Arg.Any<IXdbContext>(), Arg.Any<string>()).Returns(contact);

            // Act
            service.Update(expectedTrackingData);

            // Assert
            service.Received().SetContactFacet(Arg.Any<IXdbContext>(), Arg.Any<Contact>(), Arg.Any<TrackingData>(), Arg.Any<string>());
        }

        [Theory]
        [AutoData]
        public void Update_ShouldUpdateBooking_IfContactExists(Contact contact, PushNotificationBookingRequest expectedBookingData)
        {
            // Arrange
            var client = Substitute.For<IXdbContext>();

            service.When(x => x.GetClient()).DoNotCallBase();
            service.When(x => x.SetContactFacet(Arg.Any<IXdbContext>(), Arg.Any<Contact>(), Arg.Any<PushNotificationBooking>(), Arg.Any<string>())).DoNotCallBase();
            service.GetClient().Returns(client);
            service.GetCurrentTrackerContact(Arg.Any<IXdbContext>(), Arg.Any<string>()).Returns(contact);

            // Act
            service.UpdateBooking(expectedBookingData);

            // Assert
            service.Received().SetContactFacet(Arg.Any<IXdbContext>(), Arg.Any<Contact>(), Arg.Any<PushNotificationBooking>(), Arg.Any<string>());
        }

        [Theory]
        [AutoData]
        public void Update_ShouldLogError_XdbExecutionException(PushNotificationBookingRequest expectedBookingData)
        {
            // Arrange
            service.When(x => x.GetClient()).DoNotCallBase();
            service.When(x => x.GetClient()).Throw(new XdbExecutionException());

            // Act
            service.UpdateBooking(expectedBookingData);

            // Assert
            logger.Received(1).Error(Arg.Any<string>(), Arg.Any<Exception>(), Arg.Any<object>());
        }
    }
}
