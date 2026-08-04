using System;
using AutoFixture;
using AutoFixture.Xunit2;
using easyJet.Foundation.Multisite.Pipelines.GetLookupSourceItems;
using easyJet.Foundation.Multisite.Pipelines.ResolveTokens;
using easyjet.Foundation.Testing.Attributes;
using FluentAssertions;
using NSubstitute;
using Sitecore.Data.Items;
using Sitecore.FakeDb;
using Sitecore.FakeDb.Pipelines;
using Sitecore.Pipelines.GetLookupSourceItems;
using Xunit;

namespace easyJet.Foundation.Multisite.Tests.Pipelines.GetLookupSourceItems
{
    public class ResolveTokenizedLookupSourceProcessorTests
    {
        private readonly Fixture fixture;
        private readonly Db db;

        private readonly ResolveTokenizedLookupSourceProcessor resolveTokenizedLookupSourceProcessor;

        public ResolveTokenizedLookupSourceProcessorTests()
        {
            fixture = new Fixture();
            db = fixture.Freeze<Db>();
            resolveTokenizedLookupSourceProcessor = new ResolveTokenizedLookupSourceProcessor();
        }

        [Fact]
        public void Process_ShouldThrowException_IfArgsIsNull()
        {
            // Act
            Action actual = () => resolveTokenizedLookupSourceProcessor.Process(null);

            // Assert
            actual.Should().Throw<InvalidOperationException>();
        }

        [Theory]
        [AutoDbData]
        public void Process_ShouldNotTrowException_IfArgsNotNull(Item item, string source)
        {
            // Arrange
            var args = new GetLookupSourceItemsArgs();
            args.Item = item;
            args.Source = source;

            // Act
            Action actual = () => resolveTokenizedLookupSourceProcessor.Process(args);

            // Assert
            actual.Should().NotThrow<InvalidOperationException>();
        }

        [Theory]
        [AutoData]
        public void Process_ShouldSetSource_IfArgsSourceContainsDollarSign(string source, string suffix)
        {
            // Arrange
            var dbItem = fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            db.Add(dbItem);

            var args = new GetLookupSourceItemsArgs();
            args.Item = db.GetItem(dbItem.ID);
            args.Source = source + "$";

            using (Db db = new Db())
            {
                var processor = Substitute.For<IPipelineProcessor>();
                processor.When(p => p.Process(Arg.Any<ResolveTokensArgs>()))
                         .Do(ci => ci.Arg<ResolveTokensArgs>().Query = source + suffix);

                db.PipelineWatcher.Register("resolveTokens", processor);

                // Act
                resolveTokenizedLookupSourceProcessor.Process(args);
                var actual = args.Source;

                // Assert
                actual.Should().Be(source + suffix);
            }
        }
    }
}
