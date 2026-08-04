using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Reflection;
using AutoFixture.Xunit2;
using easyJet.Feature.Booking.Commands;
using easyJet.Feature.Booking.Logging;
using easyJet.Feature.Booking.Models;
using easyJet.Foundation.SitecoreExtensions.Services;
using easyJet.Foundation.WebApi.Models;
using easyJet.Foundation.WebApi.Services.CancellationAndRefund;
using FluentAssertions;
using NSubstitute;
using Sitecore.Abstractions;
using Sitecore.Data.Items;
using Sitecore.FakeDb;
using Sitecore.Resources.Media;
using Sitecore.Shell.Framework.Commands;
using Xunit;

namespace easyJet.Feature.Booking.Tests.Commands
{
    public class RunBulkToolProcessCommandTests
    {
        private readonly ICsvUtilsService csvUtilsService;
        private readonly BaseMediaManager mediaManager;
        private readonly ICancellationAndRefundService dataService;
        private readonly IFileService fileService;
        private readonly IBookingLogger logger;
        private readonly RunBulkToolProcessCommand command;
        private readonly IUserCreationService userCreationService;

        private readonly Models.Booking[] bookings = new Models.Booking[]
        {
                new Models.Booking() { Reference = "1010001", Flag = "cancel" },
                new Models.Booking() { Reference = "1010002", Flag = "cancel and refund" },
                new Models.Booking() { Reference = "1010003", Flag = "refund" },
                new MemoBooking() { Reference = "1010004", Flag = "memo", MemoCode = ":BC", MemoDescription = "Test memo" },
                new CreditBooking() { Reference = "simple@email.com", Flag = "add credit", Reason = "reason", Source = "source", Memo = "memo", Amount = "100" },
                new CancelAndCreditBooking() { Reference = "1010006", Flag = "cancel and credit" },
                new SpendCredit() { Reference = "1010007", Flag = "spend credit", Amount = "100", Email = "test@email.com" },
                new TransferCredit() { Reference = "1010008", Flag = "transfer credit", Amount = "50", Email = "test@mail.com" }
        };

        private readonly string[] rows = new string[]
        {
                "Reference,flag",
                "1010001,cancel",
                "1010002,cancel and refund",
                "1010003,refund",
                "1010004,memo",
                "simple@email.com,add credit,reason,source,memo,100",
                "1010006,cancel and credit",
                "1010007,spend credit",
                "1010008,transfer credit"
        };

        public RunBulkToolProcessCommandTests()
        {
            csvUtilsService = Substitute.For<ICsvUtilsService>();
            mediaManager = Substitute.For<BaseMediaManager>();
            dataService = Substitute.For<ICancellationAndRefundService>();
            fileService = Substitute.For<IFileService>();
            logger = Substitute.For<IBookingLogger>();
            userCreationService = Substitute.For<IUserCreationService>();
            command = new RunBulkToolProcessCommand(csvUtilsService, mediaManager, logger, dataService, fileService, userCreationService);
        }

        [Theory]
        [AutoData]
        public void IsCommandContextValid_ShouldBeFalse_IfDataInvalid(Db db)
        {
            // Arrange
            var dbItem = new DbItem("Cancellation and refund item");

            db.Add(dbItem);

            // Act
            var actual = command.IsCommandContextValid(new CommandContext(db.GetItem(dbItem.ID)));

            // Assert
            actual.Should().BeFalse();
        }

        [Fact]
        public void QueryState_ShouldHideCommand_IfContextItemIsNull()
        {
            // Act
            var actual = command.QueryState(new CommandContext(items: null));

            // Assert
            actual.Should().Be(CommandState.Hidden);
        }

        [Theory]
        [AutoData]
        public void QueryState_ShouldHideCommand_IfContextItemExists(Db db)
        {
            // Arrange
            var commandDbItem = new DbItem("command item");
            db.Add(commandDbItem);
            // Act
            var actual = command.QueryState(new CommandContext(db.GetItem(commandDbItem.ID)));

            // Assert
            actual.Should().Be(CommandState.Hidden);
        }

        [Theory]
        [AutoData]
        public void RunBulkCancellationAndRefundCommand_ShouldCatchException_IfServiceThrowException(Db db)
        {
            // Arrange
            var cancellationAndRefundDbItem = new DbItem("Cancellation and refund item");
            var cancellationAndRefundInputFileField = new DbField(Constants.Fields.CancellationAndRefund.InputFile);
            var cancellationAndRefundOutputField = new DbField(Constants.Fields.CancellationAndRefund.Output);
            var cancellationAndRefundStatusField = new DbField(Constants.Fields.CancellationAndRefund.Status);
            var cancellationAndRefundOutputFileField = new DbField(Constants.Fields.CancellationAndRefund.OutputFile);

            cancellationAndRefundDbItem.Fields.Add(cancellationAndRefundInputFileField);
            cancellationAndRefundDbItem.Fields.Add(cancellationAndRefundOutputField);
            cancellationAndRefundDbItem.Fields.Add(cancellationAndRefundStatusField);
            cancellationAndRefundDbItem.Fields.Add(cancellationAndRefundOutputFileField);

            db.Add(cancellationAndRefundDbItem);

            csvUtilsService.When(x => x.WriteToCsv(Arg.Any<List<CancellationAndRefundResponse>>())).Do(x => throw new Exception());

            var item = db.GetItem(cancellationAndRefundDbItem.ID);
            // Act
            command.GetType().GetMethod("Process", BindingFlags.NonPublic | BindingFlags.Instance).Invoke(command, new object[] { item });

            // Assert
            logger.Received().Error(Arg.Any<string>(), Arg.Any<Exception>(), Arg.Any<object>());
        }

        [Theory]
        [AutoData]
        public void RunBulkCancellationAndRefundCommand_ShouldProcessBookings_IfDataExist(Db db)
        {
            // Arrange
            var outputFileDbItem = new DbItem("output file db item");
            db.Add(outputFileDbItem);
            var cancellationAndRefundDbItem = new DbItem("Cancellation and refund item");
            var cancellationAndRefundFileDBItem = new DbItem("FakeFile")
            {
                ParentID = Sitecore.ItemIDs.MediaLibraryRoot
            };

            var cancellationAndRefundFileField = new DbField(Constants.Fields.CancellationAndRefund.InputFile)
            {
                Type = "FileField",
                Value = $"<link linktype=\"media\" mediaid=\"{cancellationAndRefundDbItem.ID.ToString()}\" />"
            };
            var cancellationAndRefundOutputField = new DbField(Constants.Fields.CancellationAndRefund.Output);
            var cancellationAndRefundStatusField = new DbField(Constants.Fields.CancellationAndRefund.Status);
            var cancellationAndRefundOutputFileField = new DbField(Constants.Fields.CancellationAndRefund.OutputFile);

            cancellationAndRefundDbItem.Fields.Add(cancellationAndRefundFileField);
            cancellationAndRefundDbItem.Fields.Add(cancellationAndRefundOutputField);
            cancellationAndRefundDbItem.Fields.Add(cancellationAndRefundStatusField);
            cancellationAndRefundDbItem.Fields.Add(cancellationAndRefundOutputFileField);

            db.Add(cancellationAndRefundFileDBItem);
            db.Add(cancellationAndRefundDbItem);

            var mediaItem = new MediaItem(db.GetItem(cancellationAndRefundFileDBItem.ID));
            using (var memoryStream = new MemoryStream())
            {
                byte[] fakeText = System.Text.Encoding.UTF8.GetBytes("Faketext");
                memoryStream.Write(fakeText, 0, fakeText.Length);

                var mediaStream = new MediaStream(memoryStream, "csv", mediaItem);
                mediaManager.GetMedia(Arg.Any<MediaItem>()).GetStream().Returns(mediaStream);
            }

            csvUtilsService.GetCsvRows(Arg.Any<Stream>()).ReturnsForAnyArgs(rows);

            MockCsvUtilService(bookings, rows.Skip(1));

            for (int i = 0; i < bookings.Length; i++)
            {
                dataService
                    .GetCancellationAndRefundresult(Arg.Any<Models.Booking>())
                    .ReturnsForAnyArgs(new CancellationAndRefundResponse()
                    {
                        Message = "Reference passed",
                        Reference = bookings[i].Reference,
                        CorrelationId = Guid.NewGuid().ToString(),
                        Note = "Fake test"
                    });
            }

            var result = new System.Net.Http.HttpResponseMessage() { StatusCode = HttpStatusCode.OK };

            csvUtilsService
                .GenerateCsvFileReponseMessage(Arg.Any<byte[]>(), Arg.Any<string>())
                .ReturnsForAnyArgs(result);

            var item = db.GetItem(cancellationAndRefundDbItem.ID);

            fileService.SaveFileToMediaFolder(Arg.Any<byte[]>(), Arg.Any<string>(), Arg.Any<Item>()).ReturnsForAnyArgs(db.GetItem(outputFileDbItem.ID));

            // Act
            command.GetType().GetMethod("Process", BindingFlags.NonPublic | BindingFlags.Instance).Invoke(command, new object[] { item });

            // Assert
            logger.Received().Info(Arg.Any<string>(), Arg.Any<object>());
        }

        [Theory]
        [AutoData]
        public void RunBulkCancellationAndRefundCommand_ShouldProcessBookings_IfCannotReciveDataFromWebApi(Db db)
        {
            // Arrange
            var cancellationAndRefundDbItem = new DbItem("Cancellation and refund item");
            var cancellationAndRefundFileDBItem = new DbItem("FakeFile")
            {
                ParentID = Sitecore.ItemIDs.MediaLibraryRoot
            };

            var cancellationAndRefundFileField = new DbField(Constants.Fields.CancellationAndRefund.InputFile)
            {
                Type = "FileField",
                Value = $"<link linktype=\"media\" mediaid=\"{cancellationAndRefundDbItem.ID.ToString()}\" />"
            };
            var cancellationAndRefundOutputField = new DbField(Constants.Fields.CancellationAndRefund.Output);
            var cancellationAndRefundStatusField = new DbField(Constants.Fields.CancellationAndRefund.Status);
            var cancellationAndRefundOutputFileField = new DbField(Constants.Fields.CancellationAndRefund.OutputFile);

            cancellationAndRefundDbItem.Fields.Add(cancellationAndRefundFileField);
            cancellationAndRefundDbItem.Fields.Add(cancellationAndRefundOutputField);
            cancellationAndRefundDbItem.Fields.Add(cancellationAndRefundStatusField);
            cancellationAndRefundDbItem.Fields.Add(cancellationAndRefundOutputFileField);

            db.Add(cancellationAndRefundFileDBItem);
            db.Add(cancellationAndRefundDbItem);

            var mediaItem = new MediaItem(db.GetItem(cancellationAndRefundFileDBItem.ID));
            using (var memoryStream = new MemoryStream())
            {
                byte[] fakeText = System.Text.Encoding.UTF8.GetBytes("Faketext");
                memoryStream.Write(fakeText, 0, fakeText.Length);

                var mediaStream = new MediaStream(memoryStream, "csv", mediaItem);
                mediaManager.GetMedia(Arg.Any<MediaItem>()).GetStream().Returns(mediaStream);
            }

            csvUtilsService.GetCsvRows(Arg.Any<Stream>()).ReturnsForAnyArgs(rows);

            MockCsvUtilService(bookings, rows.Skip(1));

            for (int i = 0; i < bookings.Length; i++)
            {
                dataService
                    .GetCancellationAndRefundresult(Arg.Any<Models.Booking>())
                    .Returns<object>(returnThis: null);
            }

            var result = new System.Net.Http.HttpResponseMessage() { StatusCode = HttpStatusCode.OK };

            csvUtilsService
                .GenerateCsvFileReponseMessage(Arg.Any<byte[]>(), Arg.Any<string>())
                .ReturnsForAnyArgs(result);

            var item = db.GetItem(cancellationAndRefundDbItem.ID);

            // Act
            command.GetType().GetMethod("Process", BindingFlags.NonPublic | BindingFlags.Instance).Invoke(command, new object[] { item });

            // Assert
            logger.Received().Info(Arg.Any<string>(), Arg.Any<object>());
        }

        private void MockCsvUtilService(Models.Booking[] bookings, IEnumerable<string> csvRows)
        {
            var bookingsRows = csvRows.ToArray();
            for (int i = 0; i < bookingsRows.Length; i++)
            {
                csvUtilsService.CreateFromCsv<Models.Booking>(bookingsRows[i]).Returns(bookings[i]);
                switch (bookings[i].Flag.ToLower().Trim())
                {
                    case Constants.Commands.AddCreditCommand:
                        {
                            csvUtilsService.CreateFromCsv<Models.CreditBooking>(bookingsRows[i]).Returns((CreditBooking)bookings[i]);
                            break;
                        }

                    case Constants.Commands.SpendCreditCommand:
                        {
                            csvUtilsService.CreateFromCsv<Models.SpendCredit>(bookingsRows[i]).Returns((SpendCredit)bookings[i]);
                            break;
                        }

                    case Constants.Commands.CancelAndCreditCommand:
                        {
                            csvUtilsService.CreateFromCsv<Models.CancelAndCreditBooking>(bookingsRows[i]).Returns((CancelAndCreditBooking)bookings[i]);
                            break;
                        }

                    case Constants.Commands.ModifyMemoCommand:
                        {
                            csvUtilsService.CreateFromCsv<Models.MemoBooking>(bookingsRows[i]).Returns((MemoBooking)bookings[i]);
                            break;
                        }

                    case Constants.Commands.TransferCreditCommand:
                        {
                            csvUtilsService.CreateFromCsv<Models.TransferCredit>(bookingsRows[i]).Returns((TransferCredit)bookings[i]);
                            break;
                        }
                }
            }
        }
    }
}