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
    public class PromotionRedemptionValidationProcessorTests
    {
        private readonly PromotionRedemptionValidationProcessor processor;

        public PromotionRedemptionValidationProcessorTests()
        {
            processor = new PromotionRedemptionValidationProcessor();
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
        public void Process_AbortProccess_IfRedemptionFieldChanged(Db db)
        {
            // Arrange
            var itemDb = new DbItem("Promotion Item", ID.NewID, Templates.PromotionCodeConfiguration.Id)
            {
                new DbField(Templates.PromotionCodeConfiguration.Fields.IsPromotionInVoucherify)
                {
                      { "en", "1" }
                },
                new DbField(Templates.Promotion.Fields.Redemption, Templates.Promotion.FieldsIds.Redemption)
                {
                      { "en", "2" }
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
                            ID = Templates.Promotion.FieldsIds.Redemption,
                            Value = "3"
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
