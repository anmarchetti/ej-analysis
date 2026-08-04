using System.Xml;
using easyJet.Feature.PageContent.Pipelines.SaveUI;
using FluentAssertions;
using NSubstitute;
using Sitecore.Data;
using Sitecore.FakeDb;
using Sitecore.Globalization;
using Sitecore.Pipelines.Save;
using Xunit;

namespace easyJet.Feature.PageContent.Tests.Pipelines.SaveUI
{
    public class PeriodDrivenPageValidationProcessorTests
    {
        private readonly PeriodDrivenPageValidationProcessor processor;

        public PeriodDrivenPageValidationProcessorTests()
        {
            processor = new PeriodDrivenPageValidationProcessor();
        }

        [Fact]
        public void Process_ShouldProcessProccessSaveItem_IfSaveItemIsValid()
        {
            // Arrange
            var id = ID.NewID;

            using (Db db = new Db
            {
                new DbItem("Period Driven Promo Pager", id, Constants.TemplateIds.PeriodDrivenPromoPage)
            })
            {
                var xmlDocument = Substitute.For<XmlDocument>();
                var saveArgs = new SaveArgs(xmlDocument)
                {
                    Items = new SaveArgs.SaveItem[]
                    {
                        new SaveArgs.SaveItem()
                        {
                            ID = id,
                            Fields = new SaveArgs.SaveField[]
                            {
                                new SaveArgs.SaveField()
                                {
                                    ID = Constants.FieldIds.PromoPage.StartDate,
                                    OriginalValue = string.Empty,
                                    Value = "20210217T000000Z"
                                },
                                new SaveArgs.SaveField()
                                {
                                    ID = Constants.FieldIds.PromoPage.EndDate,
                                    OriginalValue = string.Empty,
                                    Value = "20210218T000000Z"
                                },
                            },
                            Language = Language.Current
                        }
                    }
                };

                // Act
                processor.Process(saveArgs);

                // Assert
                saveArgs.Aborted.Should().BeFalse();
            }
        }
    }
}
