using System.Xml;
using easyJet.Feature.SitecoreEnhancment.Workbox;
using FluentAssertions;
using NSubstitute;
using Xunit;

namespace easyJet.Feature.SitecoreEnhancment.Tests.Workbox
{
    public class WorkboxDictionaryTest
    {
        private const string XmlValid = @"<workbox_dictionary>
            <dictionary type=""easyJet.Feature.SitecoreEnhancment.Workbox.WorkboxDictionary, easyJet.Feature.SitecoreEnhancment"">
                <entries hint=""raw:AddEntries"">
                    <entry key=""Resort"" value=""Update to geography location""/>
                </entries>
            </dictionary>
        </workbox_dictionary>";

        private const string XmlEmpty = @"<workbox_dictionary>
            <dictionary type=""easyJet.Feature.SitecoreEnhancment.Workbox.WorkboxDictionary, easyJet.Feature.SitecoreEnhancment"">
                <entries hint=""raw:AddEntries"">
                    <entry/>
                </entries>
            </dictionary>
        </workbox_dictionary>";

        private readonly WorkboxDictionary sut;

        public WorkboxDictionaryTest()
        {
            sut = Substitute.ForPartsOf<WorkboxDictionary>();
        }

        [Fact]
        public void AddEntries_EmptyList_IfXmlNodeIsEmpty()
        {
            // Arrange
            var doc = new XmlDocument();
            doc.LoadXml(XmlEmpty);
            var node = doc.SelectSingleNode("/workbox_dictionary/dictionary/entries/entry");

            // Act
            sut.AddEntries(node);

            // Assert
            sut.Entries.Count.Should().Be(0);
        }

        [Fact]
        public void AddEntries_EmptyList_IfXmlNodeIsNull()
        {
            // Arrange
            // Act
            sut.AddEntries(null);

            // Assert
            sut.Entries.Count.Should().Be(0);
        }

        [Fact]
        public void AddEntries_NotEmptyList_IfXmlNodeIsCorrect()
        {
            // Arrange
            var doc = new XmlDocument();
            doc.LoadXml(XmlValid);
            var node = doc.SelectSingleNode("/workbox_dictionary/dictionary/entries/entry");

            // Act
            sut.AddEntries(node);

            // Assert
            sut.Entries.Count.Should().Be(1);
        }

        [Fact]
        public void AddEntries_Success_IfXmlNodeIsCorrect()
        {
            // Arrange
            var doc = new XmlDocument();
            doc.LoadXml(XmlValid);
            var node = doc.SelectSingleNode("/workbox_dictionary/dictionary/entries/entry");

            // Act
            sut.AddEntries(node);
            sut.AddEntries("key", node);

            // Assert
            sut.Entries.Count.Should().Be(2);
        }
    }
}