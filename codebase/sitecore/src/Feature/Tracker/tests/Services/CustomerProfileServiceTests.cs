using System;
using AutoFixture.Xunit2;
using easyJet.Feature.Tracker.Logging;
using easyJet.Feature.Tracker.Models.Requests;
using easyJet.Feature.Tracker.Services;
using easyJet.Foundation.Analytics.Services;
using NSubstitute;
using Sitecore.XConnect;
using Sitecore.XConnect.Collection.Model;
using Sitecore.XConnect.Operations;
using Xunit;

namespace easyJet.Feature.Tracker.Tests.Services
{
    public class CustomerProfileServiceTests
    {
        private readonly ITrackerLogger logger;
        private readonly IContactService contactService;
        private readonly CustomerProfileService service;

        public CustomerProfileServiceTests()
        {
            contactService = Substitute.For<IContactService>();
            logger = Substitute.For<ITrackerLogger>();
            service = Substitute.ForPartsOf<CustomerProfileService>(logger, contactService);
        }

        [Fact]
        public void TrackLogIn_Should_Throw_For_Null_Request()
        {
            Assert.Throws<ArgumentNullException>(() => service.TrackLogIn(null));
        }

        [Fact]
        public void TrackLogIn_Should_Throw_For_Null_Current_Contact()
        {
            // Arrange
            var client = Substitute.For<IXdbContext>();

            service.When(x => x.GetClient()).DoNotCallBase();
            service.GetClient().Returns(client);

            service.When(x => x.GetCurrentTrackerContact(Arg.Any<IXdbContext>(), Arg.Any<string[]>())).DoNotCallBase();
            service.GetCurrentTrackerContact(Arg.Any<IXdbContext>(), Arg.Any<string[]>()).Returns((Contact)null);

            // Act
            var request = new TrackCustomerLogInRequest()
            {
                FirstName = "firstName",
                LastName = "lastName",
                Title = "title"
            };

            // Assert
            Assert.Throws<XdbExecutionException>(() => service.TrackLogIn(request));
        }

        [Theory]
        [AutoData]
        public void TrackLogIn_Should_Set_PersonalInfoFacet_When_Required_Params_Not_Null(string firstName, string lastName, string title)
        {
            // Arrange
            var client = Substitute.For<IXdbContext>();
            var contact = new Contact();

            service.When(x => x.GetClient()).DoNotCallBase();
            service.GetClient().Returns(client);

            service.When(x => x.GetCurrentTrackerContact(Arg.Any<IXdbContext>(), Arg.Any<string[]>())).DoNotCallBase();
            service.GetCurrentTrackerContact(Arg.Any<IXdbContext>(), Arg.Any<string[]>()).Returns(contact);

            // Act
            var request = new TrackCustomerLogInRequest()
            {
                FirstName = firstName,
                LastName = lastName,
                Title = title
            };

            service.TrackLogIn(request);

            // Assert
            client.Received().RegisterOperation(Arg.Is<SetFacetOperation<PersonalInformation>>(x =>
                x.Facet.FirstName == firstName &&
                x.Facet.LastName == lastName &&
                x.Facet.Title == title));
        }

        [Fact]
        public void TrackLogIn_Should_Not_Set_PersonalInfoFacet_When_Required_Params_Are_Null()
        {
            // Arrange
            var client = Substitute.For<IXdbContext>();
            var contact = new Contact();

            service.When(x => x.GetClient()).DoNotCallBase();
            service.GetClient().Returns(client);

            service.When(x => x.GetCurrentTrackerContact(Arg.Any<IXdbContext>(), Arg.Any<string[]>())).DoNotCallBase();
            service.GetCurrentTrackerContact(Arg.Any<IXdbContext>(), Arg.Any<string[]>()).Returns(contact);

            // Act
            var request = new TrackCustomerLogInRequest()
            {
                FirstName = null,
                LastName = null,
                Title = null
            };

            service.TrackLogIn(request);
            client.DidNotReceive().RegisterOperation(Arg.Any<SetFacetOperation<PersonalInformation>>());
        }

        [Theory]
        [AutoData]
        public void TrackLogIn_Should_Set_PhoneNumbersFacet_When_Required_Params_Not_Null(string code, string number)
        {
            // Arrange
            var client = Substitute.For<IXdbContext>();
            var contact = new Contact();

            service.When(x => x.GetClient()).DoNotCallBase();
            service.GetClient().Returns(client);

            service.When(x => x.GetCurrentTrackerContact(Arg.Any<IXdbContext>(), Arg.Any<string[]>())).DoNotCallBase();
            service.GetCurrentTrackerContact(Arg.Any<IXdbContext>(), Arg.Any<string[]>()).Returns(contact);

            // Act
            var request = new TrackCustomerLogInRequest()
            {
                MobilePhoneCode = code,
                MobilePhoneNumber = number
            };

            service.TrackLogIn(request);

            // Assert
            client.Received().RegisterOperation(Arg.Is<SetFacetOperation<PhoneNumberList>>(x => x.Facet.PreferredPhoneNumber.CountryCode == code && x.Facet.PreferredPhoneNumber.Number == number));
        }

        [Fact]
        public void TrackLogIn_Should_Not_Set_PhoneNumbersFacet_When_Required_Params_Are_Null()
        {
            // Arrange
            var client = Substitute.For<IXdbContext>();
            var contact = new Contact();

            service.When(x => x.GetClient()).DoNotCallBase();
            service.GetClient().Returns(client);

            service.When(x => x.GetCurrentTrackerContact(Arg.Any<IXdbContext>(), Arg.Any<string[]>())).DoNotCallBase();
            service.GetCurrentTrackerContact(Arg.Any<IXdbContext>(), Arg.Any<string[]>()).Returns(contact);

            // Act
            var request = new TrackCustomerLogInRequest()
            {
                MobilePhoneCode = null,
                MobilePhoneNumber = null
            };

            service.TrackLogIn(request);

            // Assert
            client.DidNotReceive().RegisterOperation(Arg.Any<SetFacetOperation<PhoneNumberList>>());
        }

        [Theory]
        [AutoData]
        public void TrackLogIn_Should_Set_Identifiers(string id, string email, string ucid)
        {
            // Arrange
            var client = Substitute.For<IXdbContext>();
            var contact = new Contact();

            service.When(x => x.GetClient()).DoNotCallBase();
            service.GetClient().Returns(client);

            service.When(x => x.AddIdentifierToCurrentContact(Arg.Any<string>(), Arg.Any<string>())).DoNotCallBase();

            service.When(x => x.GetCurrentTrackerContact(Arg.Any<IXdbContext>(), Arg.Any<string[]>())).DoNotCallBase();
            service.GetCurrentTrackerContact(Arg.Any<IXdbContext>(), Arg.Any<string[]>()).Returns(contact);

            // Act
            var request = new TrackCustomerLogInRequest()
            {
                Email = email,
                Id = id,
                Ucid = ucid
            };

            service.TrackLogIn(request);

            // Assert
            service.Received().AddIdentifierToCurrentContact(Arg.Is<string>(x => x == "digital"), Arg.Is<string>(y => y == email));

            service.Received().AddIdentifierToCurrentContact(Arg.Is<string>(x => x == "digital"), Arg.Is<string>(y => y == id));

            service.Received().AddIdentifierToCurrentContact(Arg.Is<string>(x => x == "digital"), Arg.Is<string>(y => y == ucid));
        }

        [Theory]
        [InlineData("email", "id", "uid", 3)]
        [InlineData("", "", "", 0)]
        [InlineData(null, null, null, 0)]
        [InlineData(null, "", "", 0)]
        [InlineData("email", "id", "", 2)]
        [InlineData(null, "id", "uid", 2)]
        [InlineData(null, "id", "", 1)]
        public void TrackLogIn_Should_Skip_Null_Identifiers(string id, string email, string ucid, int expectedNumberOfAddedIds)
        {
            // Arrange
            var client = Substitute.For<IXdbContext>();
            var contact = new Contact();

            service.When(x => x.GetClient()).DoNotCallBase();
            service.GetClient().Returns(client);

            service.When(x => x.AddIdentifierToCurrentContact(Arg.Any<string>(), Arg.Any<string>())).DoNotCallBase();

            service.When(x => x.GetCurrentTrackerContact(Arg.Any<IXdbContext>(), Arg.Any<string[]>())).DoNotCallBase();
            service.GetCurrentTrackerContact(Arg.Any<IXdbContext>(), Arg.Any<string[]>()).Returns(contact);

            // Act
            var request = new TrackCustomerLogInRequest()
            {
                Email = email,
                Id = id,
                Ucid = ucid
            };

            service.TrackLogIn(request);

            // Assert
            service.Received(expectedNumberOfAddedIds).AddIdentifierToCurrentContact(Arg.Any<string>(), Arg.Any<string>());
        }
    }
}
