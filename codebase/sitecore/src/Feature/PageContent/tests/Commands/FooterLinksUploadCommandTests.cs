using AutoFixture.Xunit2;
using easyJet.Feature.PageContent.Commands;
using easyJet.Feature.PageContent.Models.FooterLinks;
using easyJet.Foundation.Analytics.Logging;
using easyJet.Foundation.SitecoreExtensions.Services;
using FluentAssertions;
using NSubstitute;
using Sitecore.Data;
using Sitecore.Data.Items;
using Sitecore.NSubstituteUtils;
using Xunit;

namespace easyJet.Feature.PageContent.Tests.Commands
{
    public class FooterLinksUploadCommandTests
    {
        private readonly FooterLinksUploadCommand command;

        public FooterLinksUploadCommandTests()
        {
            // Arrange
            command = Substitute.ForPartsOf<FooterLinksUploadCommand>(Substitute.For<IAnalyticsLogger>(), Substitute.For<IDatabaseProvider>(), Substitute.For<IUserCreationService>(), Substitute.For<ISitecoreUIService>());
        }

        [Theory]
        [AutoData]
        public void ProcessItems_ShouldNotBeEmpty_IfGetFileReturnsData(FooterLinkContainer data)
        {
            // Arrange
            var contextItem = new FakeItem()
                .WithField(Constants.Fields.FooterLinkContainer.ListOfTitles, string.Empty)
                .WithField(Constants.Fields.FooterLinkContainer.DesktopTitle, string.Empty)
                .WithField(Constants.Fields.FooterLinkContainer.MobileTitle, string.Empty)
                .WithItemEditing()
                .ToSitecoreItem();

            var linkGroupItem = new FakeItem()
                .WithField(Constants.Fields.FooterLinkContainer.FooterLinkGroup.Title, string.Empty)
                .WithField(Constants.Fields.FooterLinkContainer.FooterLinkGroup.ListOfSubtitles, string.Empty)
                .WithTemplate(Constants.TemplateIds.FooterLinkGroup)
                .WithItemEditing()
                .ToSitecoreItem();

            contextItem.Add(Arg.Any<string>(), Arg.Is<TemplateID>(x => x.ID == linkGroupItem.TemplateID)).Returns(linkGroupItem);

            var footerLink = new FakeItem()
               .WithField(Constants.Fields.FooterLinkContainer.FooterLinkGroup.FooterLink.Subtitle, string.Empty)
               .WithField(Constants.Fields.FooterLinkContainer.FooterLinkGroup.FooterLink.Link, string.Empty)
               .WithTemplate(Constants.TemplateIds.FooterLink)
               .WithItemEditing()
               .ToSitecoreItem();

            linkGroupItem.Add(Arg.Any<string>(), Arg.Is<TemplateID>(x => x.ID == footerLink.TemplateID)).Returns(footerLink);

            command.GetFileData<FooterLinkContainer>(Arg.Any<Item>()).Returns(data);

            // Act
            var actual = command.ProcessItems(contextItem);

            // Assert
            actual.Should().NotBeNull();
        }
    }
}
