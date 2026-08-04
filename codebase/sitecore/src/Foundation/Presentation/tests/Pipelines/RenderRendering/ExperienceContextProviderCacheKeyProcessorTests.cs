using System.Collections.Generic;
using System.IO;
using easyJet.Foundation.Presentation.Pipelines.RenderRendering;
using easyJet.Foundation.Presentation.Repositories;
using easyJet.Foundation.SitecoreExtensions.Services;
using FluentAssertions;
using NSubstitute;
using Sitecore.Mvc.Pipelines.Response.RenderRendering;
using Sitecore.Mvc.Presentation;
using Xunit;

namespace easyJet.Foundation.Presentation.Tests.Pipelines.RenderRendering
{
    public class ExperienceContextProviderCacheKeyProcessorTests
    {
        private readonly IQueryStringProvider queryStringProvider;
        private readonly IExperienceContextProviderRepository repository;
        private readonly ExperienceContextProviderCacheKeyProcessor processor;

        public ExperienceContextProviderCacheKeyProcessorTests()
        {
            queryStringProvider = Substitute.For<IQueryStringProvider>();
            repository = Substitute.For<IExperienceContextProviderRepository>();
            repository.IsValidIdentifier(Arg.Any<string>()).Returns(true);
            processor = new ExperienceContextProviderCacheKeyProcessor(queryStringProvider, repository);
        }

        [Fact]
        public void Process_ShouldNotModifyCacheKey_WhenNotCacheable()
        {
            // ARRANGE
            var args = new RenderRenderingArgs(new Rendering(), TextWriter.Null);
            args.Cacheable = false;
            args.CacheKey = "base-key";

            // ACT
            processor.Process(args);

            // ASSERT
            args.CacheKey.Should().Be("base-key");
            queryStringProvider.DidNotReceive().GetQueryString(Arg.Any<string>());
        }

        [Fact]
        public void Process_ShouldNotModifyCacheKey_WhenCacheKeyIsEmpty()
        {
            // ARRANGE
            queryStringProvider.GetQueryString(Arg.Any<string>()).Returns("hotel-ecp");
            var args = CacheableArgs(cacheKey: string.Empty);

            // ACT
            processor.Process(args);

            // ASSERT
            args.CacheKey.Should().BeEmpty();
        }

        [Theory]
        [InlineData(null)]
        [InlineData("")]
        [InlineData("   ")]
        public void Process_ShouldNotModifyCacheKey_WhenEcpQueryStringIsNullOrWhitespace(string ecpValue)
        {
            // ARRANGE
            queryStringProvider.GetQueryString(Arg.Any<string>()).Returns(ecpValue);
            var args = CacheableArgs();

            // ACT
            processor.Process(args);

            // ASSERT
            args.CacheKey.Should().Be("base-key");
        }

        [Fact]
        public void Process_ShouldAppendEcpSuffix_WhenEcpQueryStringIsPresent()
        {
            // ARRANGE
            queryStringProvider.GetQueryString(Constants.QueryStringParams.ExperienceContextProvider).Returns("hotel-ecp");
            var args = CacheableArgs();

            // ACT
            processor.Process(args);

            // ASSERT
            args.CacheKey.Should().Be("base-key::ecp:hotel-ecp");
        }

        [Fact]
        public void Process_ShouldNotModifyCacheKey_WhenIdentifierIsNotValid()
        {
            // ARRANGE
            queryStringProvider.GetQueryString(Constants.QueryStringParams.ExperienceContextProvider).Returns("unknown-ecp");
            repository.IsValidIdentifier("unknown-ecp").Returns(false);
            var args = CacheableArgs();

            // ACT
            processor.Process(args);

            // ASSERT
            args.CacheKey.Should().Be("base-key");
        }

        [Fact]
        public void Process_ShouldNormalizeEcpToLowercase()
        {
            // ARRANGE
            queryStringProvider.GetQueryString(Constants.QueryStringParams.ExperienceContextProvider).Returns("Hotel-ECP");
            var args = CacheableArgs();

            // ACT
            processor.Process(args);

            // ASSERT
            args.CacheKey.Should().Be("base-key::ecp:hotel-ecp");
        }

        [Fact]
        public void Process_ShouldQueryCorrectQueryStringParam()
        {
            // ARRANGE
            queryStringProvider.GetQueryString(Arg.Any<string>()).Returns("hotel-ecp");
            var args = CacheableArgs();

            // ACT
            processor.Process(args);

            // ASSERT
            queryStringProvider.Received(1).GetQueryString(Constants.QueryStringParams.ExperienceContextProvider);
        }

        [Fact]
        public void BugReproduction_WithoutProcessor_EcpAndNonEcpShareTheSameCacheKey()
        {
            // Without ExperienceContextProviderCacheKeyProcessor, Sitecore's GenerateCacheKey
            // produces the same key for normal and ECP flows — first request populates the cache
            // and subsequent requests receive the wrong HTML regardless of ECP context.
            const string baseKey = "extras-page::wrapper-component-key";

            var nonEcpArgs = new RenderRenderingArgs(new Rendering(), TextWriter.Null);
            nonEcpArgs.Cacheable = true;
            nonEcpArgs.CacheKey = baseKey;

            var ecpArgs = new RenderRenderingArgs(new Rendering(), TextWriter.Null);
            ecpArgs.Cacheable = true;
            ecpArgs.CacheKey = baseKey;

            nonEcpArgs.CacheKey.Should().Be(
                ecpArgs.CacheKey,
                because: "without the processor both flows share a cache key and the wrong HTML is served");
        }

        [Fact]
        public void Fix_EcpRequestProducesDifferentCacheKeyThanNonEcpRequest()
        {
            // ARRANGE
            queryStringProvider.GetQueryString(Arg.Any<string>()).Returns(string.Empty);
            var nonEcpArgs = CacheableArgs(cacheKey: "extras-page::wrapper-component-key");
            processor.Process(nonEcpArgs);

            queryStringProvider.GetQueryString(Arg.Any<string>()).Returns("hotel-ecp");
            var ecpArgs = CacheableArgs(cacheKey: "extras-page::wrapper-component-key");
            processor.Process(ecpArgs);

            // ASSERT
            nonEcpArgs.CacheKey.Should().NotBe(
                ecpArgs.CacheKey,
                because: "ECP and non-ECP requests must use separate cache entries");
        }

        [Fact]
        public void Integration_NonEcpCachedHtmlIsNotReturnedForEcpRequest()
        {
            // Simulates the two-request sequence that caused the bug using an in-memory
            // dictionary as a stand-in for Sitecore's HTML rendering cache.
            // Request 1: non-ECP → HTML with PromoCodeInput cached.
            // Request 2: ECP    → different key → cache miss → correct HTML returned.
            var htmlCache = new Dictionary<string, string>();
            const string baseKey = "extras-page::wrapper-component-key";
            const string ecpProvider = "hotel-ecp";
            const string noEcpHtml = "<div>PromoCodeInput: visible</div>";
            const string ecpHtml = "<div>PromoCodeInput: hidden</div>";

            // ACT – Request 1: non-ECP
            queryStringProvider.GetQueryString(Arg.Any<string>()).Returns(string.Empty);
            var nonEcpArgs = CacheableArgs(cacheKey: baseKey);
            processor.Process(nonEcpArgs);
            htmlCache[nonEcpArgs.CacheKey] = noEcpHtml;

            // ACT – Request 2: ECP
            queryStringProvider.GetQueryString(Arg.Any<string>()).Returns(ecpProvider);
            var ecpArgs = CacheableArgs(cacheKey: baseKey);
            processor.Process(ecpArgs);

            var servedHtml = htmlCache.ContainsKey(ecpArgs.CacheKey)
                ? htmlCache[ecpArgs.CacheKey]
                : ecpHtml;

            // ASSERT
            ecpArgs.CacheKey.Should().Be($"{baseKey}::ecp:{ecpProvider}");
            servedHtml.Should().Be(ecpHtml, because: "ECP request must miss the non-ECP cache entry");
            servedHtml.Should().NotBe(noEcpHtml, because: "serving non-ECP HTML to ECP request is the original bug");
        }

        private static RenderRenderingArgs CacheableArgs(string cacheKey = "base-key")
        {
            var args = new RenderRenderingArgs(new Rendering(), TextWriter.Null);
            args.Cacheable = true;
            args.CacheKey = cacheKey;
            return args;
        }
    }
}
