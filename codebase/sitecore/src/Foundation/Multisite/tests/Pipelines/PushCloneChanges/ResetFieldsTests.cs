using AutoFixture.Xunit2;
using easyJet.Foundation.Multisite.Pipelines.PushCloneChanges;
using FluentAssertions;
using NSubstitute;
using Sitecore.Data;
using Sitecore.Data.Items;
using Sitecore.NSubstituteUtils;
using Xunit;

namespace easyJet.Foundation.Multisite.Tests.Pipelines.PushCloneChanges
{
    public class ResetFieldsTests
    {
        private readonly ResetFields proccessor;

        public ResetFieldsTests()
        {
            proccessor = new ResetFields();
        }

        [Theory]
        [AutoData]
        public void Process_ShouldPushTemplateChange_IfChangeHasTemplateIdChange(ID fieldId, string expectedValue)
        {
            // Arrange
            var item = new FakeItem();
            item.WithItemEditing();
            var field = new FakeField(fieldId, item);
            var args = new PushCloneChangesArgs()
            {
                Clone = item,
                Changes = new ItemChanges(item)
            };
            args.Changes.SetFieldValue(field, expectedValue);

            // Act
            proccessor.Process(args);
            var actual = field.ToSitecoreField();

            // Assert
            actual.Received().Reset();
        }
    }
}
