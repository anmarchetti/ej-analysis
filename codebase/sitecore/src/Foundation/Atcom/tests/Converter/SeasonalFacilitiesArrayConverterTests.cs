using System.Collections.Generic;
using System.IO;
using AutoFixture.Xunit2;
using CsvHelper;
using CsvHelper.Configuration;
using easyJet.Foundation.Atcom.Converter;
using easyJet.Foundation.Atcom.Models.Domain;
using FluentAssertions;
using NSubstitute;
using Xunit;

namespace easyJet.Foundation.Atcom.Tests.Converter
{
    public class SeasonalFacilitiesArrayConverterTests
    {
        private static readonly string[] ValidData = new string[]
        {
            "CYLN0007",
            "Capo Bay",
            "TPL01",
            "STD",
            "Standard",
            "1",
            "3",
            "Triple Room",
            "AUPP",
            "1",
            "AC",
            "01-APR-21",
            "31-OCT-21",
            "1",
            "BAL",
            "01-APR-21",
            "31-OCT-21",
            "1",
            "BR",
            "01-APR-21",
            "31-OCT-21",
            "1",
            "CH",
            "01-APR-21",
            "31-OCT-21",
            "1",
            "DEL",
            "01-APR-21",
            "31-OCT-21",
        };

        [Fact]
        public void ConvertFromString_ShouldBeEmpty_IfTextIsNull()
        {
            // Arrange
            var readerRow = Substitute.For<IReaderRow>();
            var converter = new SeasonalFacilitiesArrayConverter();
            string text = null;

            // Act
            var actual = converter.ConvertFromString(text, readerRow, null);

            // Assert
            actual.Should().BeOfType<List<RoomSeasonalFacilitiesFileModel>>();
            (actual as List<RoomSeasonalFacilitiesFileModel>).Should().BeEmpty();
        }

        [Theory]
        [AutoData]
        public void ConvertFromString_ShouldReturnSesonalFacilities_IfReaderRowHasValidRecords(string text)
        {
            // Arrange
            var readerRow = Substitute.For<IReaderRow>();
            var textReader = Substitute.ForPartsOf<TextReader>();
            var config = new Configuration();
            var readingContext = new ReadingContext(textReader, config, false)
            {
                Record = ValidData
            };

            var converter = new SeasonalFacilitiesArrayConverter();

            readerRow.Context.Returns(readingContext);

            // Act
            var actual = converter.ConvertFromString(text, readerRow, null) as List<RoomSeasonalFacilitiesFileModel>;

            // Assert
            actual.Count.Should().Be(5);
            actual[0].FacilityCode.Should().Be("AC");
            actual[0].StartDate.Should().Be("01-APR-21");
            actual[0].EndDate.Should().Be("31-OCT-21");
            actual[4].FacilityCode.Should().Be("DEL");
            actual[4].StartDate.Should().Be("01-APR-21");
            actual[4].EndDate.Should().Be("31-OCT-21");
        }

        [Fact]
        public void ConvertToString_ShouldReturnEmpty_IfValueIsNotTypeOfRoomSeasonalFacilitiesFileModel()
        {
            // Arrange
            var writerRow = Substitute.For<IWriterRow>();
            var value = new List<string>();

            var converter = new SeasonalFacilitiesArrayConverter();

            // Act
            var actual = converter.ConvertToString(value, writerRow, null);

            // Assert
            actual.Should().BeEmpty();
        }

        [Fact]
        public void ConvertToString_ShouldReturnStringValue_IfDataIsRoomSeasonalFacilitiesFileModel()
        {
            // Arrange
            var writerRow = Substitute.For<IWriterRow>();
            var value = new List<RoomSeasonalFacilitiesFileModel>()
            {
                new RoomSeasonalFacilitiesFileModel() { FacilityCode = "AC", StartDate = "01-APR-21", EndDate = "31-OCT-21" },
                new RoomSeasonalFacilitiesFileModel() { FacilityCode = "DEL", StartDate = "01-APR-21", EndDate = "31-OCT-21" },
            };

            var converter = new SeasonalFacilitiesArrayConverter();

            // Act
            var actual = converter.ConvertToString(value, writerRow, null);

            // Assert
            actual.Should().Be("AC	01-APR-21	31-OCT-21	DEL	01-APR-21	31-OCT-21");
        }
    }
}