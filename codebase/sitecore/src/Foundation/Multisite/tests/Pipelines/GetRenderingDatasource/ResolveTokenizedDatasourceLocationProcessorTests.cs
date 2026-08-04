using System;
using AutoFixture;
using easyJet.Foundation.Multisite.Pipelines.GetRenderingDatasource;
using easyJet.Foundation.Multisite.Pipelines.ResolveTokens;
using easyjet.Foundation.Testing.Attributes;
using FluentAssertions;
using NSubstitute;
using Sitecore.Data.Items;
using Sitecore.FakeDb;
using Sitecore.FakeDb.Pipelines;
using Sitecore.Pipelines.GetRenderingDatasource;
using Xunit;

namespace easyJet.Foundation.Multisite.Tests.Pipelines.GetRenderingDatasource
{
    public class ResolveTokenizedDatasourceLocationProcessorTests
    {
        private readonly Fixture fixture;
        private readonly Db db;
        private readonly ResolveTokenizedDatasourceLocationProcessor resolveTokenizedDatasourceLocationProcessor;

        public ResolveTokenizedDatasourceLocationProcessorTests()
        {
            fixture = new Fixture();
            db = fixture.Freeze<Db>();
            resolveTokenizedDatasourceLocationProcessor = new ResolveTokenizedDatasourceLocationProcessor();
        }

        [Fact]
        public void Process_ShouldThrowException_IfArgsIsNull()
        {
            // Act
            Action actual = () => resolveTokenizedDatasourceLocationProcessor.Process(null);

            // Assert
            actual.Should().Throw<InvalidOperationException>();
        }

        [Theory]
        [AutoDbData]
        public void Process_ShouldNotThrowException_IfArgsIsNotNull(Item renderingItem)
        {
            // Arrange
            var args = new GetRenderingDatasourceArgs(renderingItem);

            // Act
            Action actual = () => resolveTokenizedDatasourceLocationProcessor.Process(args);

            // Assert
            actual.Should().NotThrow<InvalidOperationException>();
        }

        [Fact]
        public void Process_ShouldAddTwoDatasources_IfTwoItemsExist()
        {
            // Arrange
            var parentItem = fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            db.Add(parentItem);

            var renderingItem = fixture.Build<DbItem>().With(x => x.ParentID, parentItem.ID).Create();

            var fieldName = "Datasource Location";

            var datasourceLocationField = new DbField(fieldName)
            {
                Value = "$site/sitecore/content//*"
            };

            renderingItem.Fields.Add(datasourceLocationField);

            db.Add(renderingItem);

            var args = new GetRenderingDatasourceArgs(db.GetItem(renderingItem.ID));

            var resolveTokensArgs = new ResolveTokensArgs(db.GetItem(renderingItem.ID), "$site/sitecore/content//*");

            var processor = Substitute.For<IPipelineProcessor>();
            processor.When(p => p.Process(Arg.Any<ResolveTokensArgs>()))
                     .Do(ci => ci.Arg<ResolveTokensArgs>().Query = "/sitecore/content//*");

            db.PipelineWatcher.Register("resolveTokens", processor);

            // Act
            resolveTokenizedDatasourceLocationProcessor.Process(args);

            var actual = args;

            // Assert
            actual.DatasourceRoots.Count.Should().Be(2);
        }
    }
}
