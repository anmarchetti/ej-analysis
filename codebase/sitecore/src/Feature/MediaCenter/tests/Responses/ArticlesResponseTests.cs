using System.Collections.Generic;
using AutoFixture.Xunit2;
using easyJet.Feature.MediaCenter.Models.Domain;
using easyJet.Feature.MediaCenter.Models.Responses;
using FluentAssertions;
using Xunit;

namespace easyJet.Feature.MediaCenter.Tests.Responses
{
    public class ArticlesResponseTests
    {
        [Theory]
        [AutoData]
        public void ArticlesResponseConstructor_ShouldSetValues_IfValuesWereSupplied(int total, IEnumerable<Article> articles, IEnumerable<Topic> topics)
        {
            // Act
            var actual = new ArticlesResponse(total, articles, topics);

            // Assert
            actual.Total.Should().Be(total);
            actual.Articles.Should().BeEquivalentTo(articles);
            actual.TopicsFilter.Should().BeEquivalentTo(topics);
        }
    }
}
