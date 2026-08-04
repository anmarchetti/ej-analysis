using AutoFixture.Xunit2;
using easyJet.Feature.MediaCenter.Models.Domain;
using FluentAssertions;
using Xunit;

namespace easyJet.Feature.MediaCenter.Tests.Domain
{
    public class ArticleTests
    {
        [Theory]
        [AutoData]
        public void ArticleConstructor_ShouldSetValues_IfValuesWereSupplied(string title, string url, string image, string shortDescription, string publicationDate, string[] topics)
        {
            // Act
            var actual = new Article(title, url, image, shortDescription, publicationDate, topics);

            // Assert
            actual.Title.Should().BeEquivalentTo(title);
            actual.Url.Should().BeEquivalentTo(url);
            actual.Image.Should().BeEquivalentTo(image);
            actual.ShortDescription.Should().BeEquivalentTo(shortDescription);
            actual.PublicationDate.Should().BeEquivalentTo(publicationDate);
            actual.Topics.Should().BeEquivalentTo(topics);
        }
    }
}
