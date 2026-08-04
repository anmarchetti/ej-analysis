using System;
using System.Xml;
using easyjet.Foundation.Testing.Attributes;
using easyJet.Foundation.Voucherify.Pipelines.SaveUI;
using FluentAssertions;
using NSubstitute;
using Sitecore.Data;
using Sitecore.FakeDb;
using Sitecore.Globalization;
using Sitecore.Pipelines.Save;
using Xunit;

namespace easyJet.Foundation.Voucherify.Tests.Pipelines.SaveUI
{
    public class PromotionCriteriaValidationTests
    {
        private readonly PromotionCriteriaValidationProcessor processor;

        public PromotionCriteriaValidationTests()
        {
            processor = new PromotionCriteriaValidationProcessor();
        }

        [Fact]
        public void Process_ThrowArgumentNullException_IfArgsIsNull()
        {
            // Act
            Action actual = () => processor.Process(null);

            // Assert
            actual.Should().Throw<ArgumentNullException>();
        }

        [Theory]
        [AutoDbData]
        public void Process_AbortProccess_IfItemIsNotValid(Db db)
        {
            // Arrange
            var itemDb = new DbItem("Promotion Item", ID.NewID, Templates.Promotion.Id)
            {
                new DbField(Templates.Promotion.FieldsIds.Airport)
                {
                      { "en", "Airport" }
                }
            };

            db.Add(itemDb);

            var args = Substitute.For<SaveArgs>(new XmlDocument());
            args.Items = new SaveArgs.SaveItem[]
            {
                new SaveArgs.SaveItem()
                {
                    ID = itemDb.ID,
                    Language = Language.Parse("en"),
                    Fields = new SaveArgs.SaveField[]
                    {
                        new SaveArgs.SaveField()
                        {
                            ID = Templates.Promotion.FieldsIds.Airport,
                            Value = string.Empty
                        }
                    }
                }
            };

            args.HasSheerUI = false;

            // Act
            processor.Process(args);

            // Assert
            args.Received(1).AbortPipeline();
        }
    }
}
