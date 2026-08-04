using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Web.Mvc;
using AutoFixture.Xunit2;
using easyJet.Foundation.Destinations.ContentSearch.Repositories;
using easyJet.Foundation.Destinations.ContentSearch.SearchTypes;
using easyJet.Foundation.Destinations.Controllers;
using easyJet.Foundation.Destinations.Logging;
using easyJet.Foundation.Destinations.Models.Domain;
using easyJet.Foundation.Destinations.Models.Requests;
using easyJet.Foundation.SitecoreExtensions.Services;
using FluentAssertions;
using NSubstitute;
using Sitecore.ContentSearch.Linq;
using Sitecore.Data.Items;
using Sitecore.FakeDb;
using Xunit;

namespace easyJet.Foundation.Destinations.Tests.Controllers
{
    public class BoardTypesControllerTest
    {
        private readonly BoardTypesController boardTypesController;
        private readonly IBoardTypesRepository mockRepository;
        private readonly IDestinationsLogger logger;
        private readonly ICsvUtilsService csvUtilsService;

        public BoardTypesControllerTest()
        {
            // Arrange
            mockRepository = Substitute.For<IBoardTypesRepository>();
            logger = Substitute.For<IDestinationsLogger>();
            csvUtilsService = Substitute.For<ICsvUtilsService>();
            boardTypesController = new BoardTypesController(mockRepository, csvUtilsService, logger);
        }

        [Theory]
        [MemberData(nameof(NotValidBoardTypesByCodesRequest))]
        public void Get_ThrowArgumentException_IfRequestIsNotValid(BaseByCodesRequest request)
        {
            // Act
            Action actual = () => boardTypesController.Get(request);

            // Assert
            actual.Should().Throw<ArgumentException>();
        }

        [Theory]
        [MemberData(nameof(ValidBoardTypesByCodesRequest))]
        public void Get_ShouldBeNotNull_IfSearchResultHasData(BaseByCodesRequest request)
        {
            // Assert
            var hints = new List<SearchHit<BaseDatasourceSearchResultItem>>()
            {
                {
                    new SearchHit<BaseDatasourceSearchResultItem>(1, new BaseDatasourceSearchResultItem()
                    {
                        Code = "code",
                        ItemName = "itemName",
                    })
                }
            };
            var results = new SearchResults<BaseDatasourceSearchResultItem>(hints, 1);

            mockRepository.SearchByCodes(Arg.Any<string[]>())
                .Returns(results);

            // Act
            var actual = boardTypesController.Get(request) as JsonResult;

            // Assert
            actual.Data.Should().NotBeNull();
        }

        public static IEnumerable<object[]> ValidBoardTypesByCodesRequest
        {
            get
            {
                return new[]
                {
                    new object[]
                    {
                        new BaseByCodesRequest()
                                       {
                                            Codes = new string[1] { "code" },
                                       }
                    }
                };
            }
        }

        public static IEnumerable<object[]> NotValidBoardTypesByCodesRequest
        {
            get
            {
                return new[]
                {
                    new object[] { new BaseByCodesRequest() },
                    new object[]
                    {
                        new BaseByCodesRequest()
                                       {
                                            Codes = new string[0],
                                       }
                    }
                };
            }
        }

        [Theory]
        [AutoData]
        public void ExportBoardTypes_ShoudReturnAllBoardTypes_IfBoardTypesExist(Db db, string code, string name)
        {
            // Arrange
            var boardTypeDbItem = new DbItem("Board type");
            boardTypeDbItem.Fields.Add(Constants.Fields.DatasourceItem.Code, code);
            boardTypeDbItem.Fields.Add(Constants.Fields.DatasourceItem.Name, name);
            db.Add(boardTypeDbItem);

            mockRepository.GetAllBoardTypeItems(Arg.Any<string>()).Returns(new Item[] { db.GetItem(boardTypeDbItem.ID) });

            var data = new CsvUtilsService().WriteToCsv(new List<BoardTypeReportRow> { new BoardTypeReportRow(db.GetItem(boardTypeDbItem.ID)) });
            csvUtilsService.WriteToCsv(Arg.Any<IEnumerable<BoardTypeReportRow>>()).Returns(data);

            // Act
            var actual = (boardTypesController.ExportBoardTypes(Guid.NewGuid().ToString(), "en", "master") as FileContentResult)?.FileContents;
            using (var stram = new MemoryStream(actual))
            {
                var result = new CsvUtilsService().ReadFromCsv<BoardTypeReportRow>(stram, 1);
                // Assert
                result.Should().HaveCount(1);
                result.First().BoardCode.Should().Be(code);
                result.First().BoardDisplayName.Should().Be(name);
            }
        }
    }
}
