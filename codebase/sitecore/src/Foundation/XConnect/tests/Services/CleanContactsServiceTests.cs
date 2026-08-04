using System;
using System.Collections.Generic;
using System.Linq;
using AutoFixture.Xunit2;
using easyJet.Foundation.XConnect.Common.Logging;
using easyJet.Foundation.XConnect.Common.Services;
using FluentAssertions;
using NSubstitute;
using Sitecore.XConnect;
using Sitecore.XConnect.Client.Synchronous;
using Sitecore.XConnect.Operations;
using Xunit;

namespace easyJet.Foundation.XConnect.Common.Tests.Services
{
    public class CleanContactsServiceTests
    {
        private readonly CleanContactsService service;
        private readonly IXConnectLogger logger;
        private readonly IXdbService xConnectService;

        public CleanContactsServiceTests()
        {
            logger = Substitute.For<IXConnectLogger>();
            xConnectService = Substitute.For<IXdbService>();
            service = Substitute.ForPartsOf<CleanContactsService>(logger, xConnectService);
        }

        [Fact]
        public void CleanContactsService_ShouldReturnDeletedContacts_IfXdbHaveContacts()
        {
            // Arrange
            var client = Substitute.For<IXdbContext>();
            IReadOnlyCollection<Contact> contactCollections = new List<Contact>() { new Contact(), new Contact() };
            var query = contactCollections.ToAsyncEnumerable().AsAsyncQueryable();

            var enumerable = Substitute.For<IEntityBatchEnumerator<Contact>>();
            enumerable.MoveNext().Returns(x => true, x => false);
            enumerable.Current.Returns(contactCollections);

            xConnectService.GetContext().Returns(client);
            xConnectService.GetContactsQuery().Returns(query);
            service.GetBatchEnumeratorSync(Arg.Any<IAsyncQueryable<Contact>>()).Returns(enumerable);

            // Act
            var actual = service.CleanContacts(new DateTime(2024, 01, 01), true);

            // Assert
            actual.Should().HaveCount(2);
            client.Received().RegisterOperation(Arg.Any<DeleteContactOperation>());
        }

        [Theory]
        [AutoData]
        public void CleanInteractions_ShouldReturnDeletedInteractions_IfXdbHavInteractions(Contact contact)
        {
            // Arrange
            var client = Substitute.For<IXdbContext>();
            var interaction = new Interaction(contact, InteractionInitiator.Contact, Guid.NewGuid(), "useragent");
            IReadOnlyCollection<Interaction> interactionCollections = new List<Interaction>() { interaction };
            var query = interactionCollections.ToAsyncEnumerable().AsAsyncQueryable();

            var enumerable = Substitute.For<IEntityBatchEnumerator<Interaction>>();
            enumerable.MoveNext().Returns(x => true, x => false);
            enumerable.Current.Returns(interactionCollections);

            xConnectService.GetContext().Returns(client);
            client.Interactions.Returns(query);
            service.GetBatchEnumeratorSync(Arg.Any<IAsyncQueryable<Interaction>>()).Returns(enumerable);

            // Act
            var actual = service.CleanInteractions(new DateTime(2024, 01, 01), true);

            // Assert
            actual.Should().HaveCount(1);
            client.Received().RegisterOperation(Arg.Any<DeleteInteractionByReferenceOperation>());
        }
    }
}
