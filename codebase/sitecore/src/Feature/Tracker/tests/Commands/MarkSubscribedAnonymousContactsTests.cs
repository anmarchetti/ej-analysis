using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.Linq;
using AutoFixture;
using easyJet.Feature.Tracker.Commands;
using easyJet.Foundation.SitecoreExtensions.Services;
using easyJet.Foundation.XConnect.Common.Services;
using FluentAssertions;
using NSubstitute;
using NSubstitute.Extensions;
using Sitecore.Shell.Framework.Commands;
using Sitecore.Web.UI.Sheer;
using Sitecore.XConnect;
using Xunit;

namespace easyJet.Feature.Tracker.Tests.Commands
{
    public class MarkSubscribedAnonymousContactsTests
    {
        private readonly Fixture fixture;

        private readonly IXdbService xdbServiceMock;

        private readonly MarkSubscribedAnonymousContactsProxy sut;
        private readonly IUserCreationService userCreationService;

        public MarkSubscribedAnonymousContactsTests()
        {
            fixture = new Fixture();
            xdbServiceMock = Substitute.For<IXdbService>();
            userCreationService = Substitute.For<IUserCreationService>();
            sut = Substitute.ForPartsOf<MarkSubscribedAnonymousContactsProxy>(xdbServiceMock, userCreationService);
        }

        [Fact]
        public void ActionInvokingMarkAnonymousContacts_BuildsNewIdentifier_BatchAdds()
        {
            // Arrange
            var contact = fixture.Create<Contact>();
            var enumeratorSubstitute = Substitute.For<IAsyncEntityBatchEnumerator<Contact>>();

            enumeratorSubstitute.MoveNextAsync().Returns(true, false);
            enumeratorSubstitute.Current.Returns(new ReadOnlyCollection<Contact>(new List<Contact>() { contact }));

            sut.Configure().When(substitute => substitute.GetEnumerator()).DoNotCallBase();
            sut.Configure().GetEnumerator().Returns(enumeratorSubstitute);

            // Act
            sut.ActionProxy(null);

            // Assert
            xdbServiceMock.Received()
                .BatchAddIdentifiers(Arg.Is<Dictionary<Contact, ContactIdentifier[]>>(dict =>
                    dict.ContainsKey(contact) &&
                    dict[contact].First().Source.Equals(Foundation.Analytics.Constants.Tracking.PushNotificationsSource) &&
                    dict[contact].First().IdentifierType == ContactIdentifierType.Known));
        }

        [Theory]
        [MemberData(nameof(MarkSubscribedAnonymousContactsTestsData.ValidCommandContexts), MemberType = typeof(MarkSubscribedAnonymousContactsTestsData))]
        public void IsCommandContextValid_ContextIsAlwaysValid(CommandContext ctx)
        {
            // Arrange

            // Act
            var validityResult = sut.IsCommandContextValidProxy(ctx);

            // Assert
            validityResult.Should().BeTrue();
        }

        public class MarkSubscribedAnonymousContactsProxy : MarkSubscribedAnonymousContacts
        {
            public MarkSubscribedAnonymousContactsProxy(IXdbService xdbService, IUserCreationService userCreationService)
                : base(xdbService, userCreationService)
            {
            }

            public bool IsCommandContextValidProxy(CommandContext ctx) => base.IsCommandContextValid(ctx);

            public void ActionProxy(ClientPipelineArgs args) => base.Action(args);
        }
    }
}