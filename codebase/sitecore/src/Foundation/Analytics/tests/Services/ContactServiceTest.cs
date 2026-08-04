using System;
using System.Collections.Generic;
using AutoFixture.Xunit2;
using easyJet.Foundation.Analytics.Logging;
using easyJet.Foundation.Analytics.Services;
using easyJet.Foundation.Analytics.Tests.Helpers;
using FluentAssertions;
using NSubstitute;
using NSubstitute.Extensions;
using NSubstitute.ReturnsExtensions;
using Sitecore.Analytics;
using Sitecore.Analytics.Model;
using Sitecore.XConnect;
using Xunit;

namespace easyJet.Foundation.Analytics.Tests.Services
{
    public class ContactServiceTest : AnalyticsControllerTestsConfigurator
    {
        private readonly IAnalyticsLogger loggerMock;
        private readonly ContactService sut;

        public ContactServiceTest()
        {
            loggerMock = Substitute.For<IAnalyticsLogger>();
            sut = Substitute.ForPartsOf<ContactService>(loggerMock);
        }

        [Fact]
        public void EnsureContact_WithValidContactID_ResolvesByID()
        {
            // Arrange
            var contactID = Guid.NewGuid();
            var client = Substitute.For<IXdbContext>();
            client.GetAsync(Arg.Any<ContactReference>(), Arg.Any<ContactExecutionOptions>()).ReturnsForAnyArgs(new Contact());

            // Act
            var result = sut.EnsureContact(client, contactID);

            // Assert
            result.Should().NotBeNull();
            sut.Configure().WhenForAnyArgs(mock => mock.GetContactManagerFromFactory()).DoNotCallBase();
            sut.Configure().DidNotReceiveWithAnyArgs().GetContactManagerFromFactory();
        }

        [Theory]
        [AutoData]
        public void EnsureContact_ShouldReturnContact(Guid contactId)
        {
            // Arrange
            var contact = new Contact(new ContactIdentifier("new", contactId.ToString(), ContactIdentifierType.Known));
            string[] facetKeys = { "facet", "keys" };
            var client = Substitute.For<IXdbContext>();
            client.GetAsync(Arg.Any<ContactReference>(), Arg.Any<ContactExecutionOptions>()).Returns(contact);

            using (new TrackerSwitcher(Tracker))
            {
                var actual = sut.EnsureContact(client, facetKeys, contactId);

                // Assert
                actual.Should().NotBeNull();
                actual.Identifiers.Count.Should().Be(1);
            }
        }

        [Fact]
        public void EnsureContact_ShouldReturnNull()
        {
            // Arrange
            var client = Substitute.For<IXdbContext>();

            using (new TrackerSwitcher(Tracker))
            {
                var actual = sut.EnsureContact(client, null, null);

                // Assert
                actual.Should().BeNull();
            }
        }

        [Theory]
        [AutoData]
        public void GetIdentifier_ShouldReturnContactIdentifier(string source, string identifier)
        {
            // Arrange
            using (new TrackerSwitcher(Tracker))
            {
                var contactIdentifier = new Sitecore.Analytics.Model.Entities.ContactIdentifier(source, identifier, ContactIdentificationLevel.Anonymous);
                var contactIdentifiers = new List<Sitecore.Analytics.Model.Entities.ContactIdentifier> { contactIdentifier };
                Tracker.Contact.Identifiers.Count.Returns(2);
                Tracker.Contact.Identifiers.Returns(contactIdentifiers);

                // Act
                var actual = sut.GetIdentifier();

                // Assert
                actual.Source.Should().BeEquivalentTo(source);
                actual.Identifier.Should().BeEquivalentTo(identifier);
            }
        }

        [Fact]
        public void GetIdentifier_ShouldReturnNewIdentifiedContactReference()
        {
            // Arrange
            using (new TrackerSwitcher(Tracker))
            {
                // Act
                var actual = sut.GetIdentifier();
                // Assert
                actual.Identifier.Should().BeEquivalentTo("00000000000000000000000000000000");
            }
        }

        [Theory]
        [AutoData]
        public void GetContacts_ReturnsEmptyList_IfXDBClient_ReturnsNoContact(IReadOnlyCollection<string> identifiers, string[] facetKeys)
        {
            var client = Substitute.For<IXdbContext>();
            var actual = sut.GetContacts(client, identifiers, facetKeys).Result;
            actual.Should().BeNullOrEmpty();
        }

        [Fact]
        public void GetContacts_ReturnsEmptyList_IfIdentifiersAreEmpty()
        {
            var client = Substitute.For<IXdbContext>();
            var actual = sut.GetContacts(client, new List<string>(), Array.Empty<string>()).Result;
            actual.Should().BeNullOrEmpty();
        }

        [Fact]
        public void RemoveContactFromSession_ShouldDoNothing_IfCurrentContactIsNull()
        {
            // Arrange
            Tracker.Contact.ReturnsNullForAnyArgs();
            using (new TrackerSwitcher(Tracker))
            {
                // Act
                sut.RemoveContactFromSession();

                // Assert
                loggerMock.Received().Debug("Tracker.Current.Contact is null.", sut);
            }
        }

        [Fact]
        public void RemoveContactFromSession_ShouldThrowException_IfContactManagerCannotBeCreated()
        {
            // Arrange
            using (new TrackerSwitcher(Tracker))
            {
                // Act/Assert
                Assert.Throws<InvalidOperationException>(() => sut.RemoveContactFromSession());
            }
        }

        [Theory]
        [InlineData(null, null)]
        [InlineData("", "")]
        [InlineData(null, "identifier")]
        [InlineData("", "identifier")]
        [InlineData(null, "")]
        [InlineData("", null)]
        [InlineData("source", null)]
        [InlineData("source", "")]
        public void AddIdentifierToCurrentContact_ThrowException_IfParamsAreNull(string source, string identifier)
        {
            // Arrange
            using (new TrackerSwitcher(Tracker))
            {
                // Act/Assert
                Assert.Throws<Exception>(() => sut.AddIdentifierToCurrentContact(source, identifier));
                sut.DidNotReceive().GetContactManagerFromFactory();
            }
        }

        [Theory]
        [InlineData("source", "identifier")]
        public void AddIdentifierToCurrentContact_ThrowException_IfCurrentContactIsNull(string source, string identifier)
        {
            // Arrange
            Tracker.Contact.ReturnsNullForAnyArgs();
            using (new TrackerSwitcher(Tracker))
            {
                // Act/Assert
                Assert.Throws<Exception>(() => sut.AddIdentifierToCurrentContact(source, identifier));
                sut.DidNotReceive().GetContactManagerFromFactory();
            }
        }

        [Theory]
        [InlineData("source", "identifier")]
        public void AddIdentifierToCurrentContact_ShouldDoNothing_IfIdentifierExistsOnCurrentContact(string source, string identifier)
        {
            // Arrange
#pragma warning disable NS1000
            Tracker.Contact.Identifiers.Returns(new[] { new Sitecore.Analytics.Model.Entities.ContactIdentifier(source, identifier, ContactIdentificationLevel.Known) });
#pragma warning restore NS1000
            using (new TrackerSwitcher(Tracker))
            {
                // Act/Assert
                sut.AddIdentifierToCurrentContact(source, identifier);
                sut.DidNotReceive().GetContactManagerFromFactory();
            }
        }

        [Theory]
        [InlineData("source", "identifier")]
        public void AddIdentifierToCurrentContact_ThrowException_IfContactManagerCannotBeCreated(string source, string identifier)
        {
            // Arrange
            using (new TrackerSwitcher(Tracker))
            {
                // Act/Assert
                Assert.Throws<InvalidOperationException>(() => sut.AddIdentifierToCurrentContact(source, identifier));
                sut.Received().GetContactManagerFromFactory();
            }
        }
    }
}