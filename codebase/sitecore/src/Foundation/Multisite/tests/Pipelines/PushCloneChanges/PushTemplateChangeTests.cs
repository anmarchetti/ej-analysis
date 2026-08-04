using AutoFixture.Xunit2;
using easyJet.Foundation.Multisite.Pipelines.PushCloneChanges;
using FluentAssertions;
using Sitecore.Data;
using Sitecore.Data.Items;
using Sitecore.NSubstituteUtils;
using Xunit;

namespace easyJet.Foundation.Multisite.Tests.Pipelines.PushCloneChanges
{
    public class PushTemplateChangeTests
    {
        private readonly PushTemplateChange proccessor;

        public PushTemplateChangeTests()
        {
            proccessor = new PushTemplateChange();
        }

        [Fact]
        public void Process_ShouldNotPushTemplateChange_IfChangeHasNotTemplateIdChange()
        {
            // Arrange
            var item = new FakeItem();
            var args = new PushCloneChangesArgs()
            {
                Clone = item,
                Changes = new ItemChanges(item)
            };

            // Act
            proccessor.Process(args);

            // Assert
            args.Clone.TemplateID.Should().Be(item.ToSitecoreItem().TemplateID);
        }

        [Theory]
        [AutoData]
        public void Process_ShouldPushTemplateChange_IfChangeHasTemplateIdChange(ID expectedId)
        {
            // Arrange
            var item = new FakeItem();
            item.WithItemEditing();
            var args = new PushCloneChangesArgs()
            {
                Clone = item,
                Changes = new ItemChanges(item)
            };
            args.Changes.Properties.Add("templateid", new PropertyChange("templateid", expectedId, item.ToSitecoreItem().TemplateID));

            // Act
            proccessor.Process(args);

            // Assert
            args.Clone.TemplateID.Should().Be(expectedId);
        }
    }
}
