using System;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.CompilerServices;
using System.Text.RegularExpressions;
using System.Threading;
using easyJet.Feature.Booking.Logging;
using easyJet.Foundation.SitecoreExtensions.Extensions;
using easyJet.Foundation.SitecoreExtensions.Helper;
using easyJet.Foundation.SitecoreExtensions.Services;
using easyJet.Foundation.WebApi.Exceptions;
using easyJet.Foundation.WebApi.Models;
using easyJet.Foundation.WebApi.Services.CancellationAndRefund;
using Sitecore;
using Sitecore.Abstractions;
using Sitecore.Configuration;
using Sitecore.Data.Fields;
using Sitecore.Data.Items;
using Sitecore.Jobs;
using Sitecore.Links.UrlBuilders;
using Sitecore.Shell.Framework.Commands;
using DateTime = System.DateTime;

[assembly: InternalsVisibleTo("easyJet.Feature.Booking.Tests")]

namespace easyJet.Feature.Booking.Commands
{
    public class RunBulkToolProcessCommand : Command
    {
        private const string ReportName = "CancellationAndRefundOutput";
        private const string AnonymizeEmailPattern = @"(?<=[\w]{1})[a-zA-Z0-9_\-\.]+(?=[\w]{1}@)";
        private const string EmailPattern = @"^([a-zA-Z0-9_\-\.]+)@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.)|(([a-zA-Z0-9\-]+\.)+))([a-zA-Z]{2,4}|[0-9]{1,3})(\]?)$";
        private static readonly string ReportPath = Settings.GetSetting("Booking.ReportPath");

        private readonly ICsvUtilsService csvUtilsService;
        private readonly BaseMediaManager mediaManager;
        private readonly ICancellationAndRefundService dataService;
        private readonly IFileService fileService;
        private readonly IUserCreationService userCreationService;
        private readonly IBookingLogger logger;

        /// <summary>
        /// Initializes a new instance of the <see cref="RunBulkToolProcessCommand"/> class.
        /// </summary>
        /// <param name="csvUtilsService">Csv utils service.</param>
        /// <param name="mediaManager">Media manager.</param>
        /// <param name="logger">Logger.</param>
        /// <param name="dataService">Data service.</param>
        /// <param name="fileService">File service.</param>
        public RunBulkToolProcessCommand(ICsvUtilsService csvUtilsService, BaseMediaManager mediaManager, IBookingLogger logger, ICancellationAndRefundService dataService, IFileService fileService, IUserCreationService userCreationService)
        {
            this.csvUtilsService = csvUtilsService;
            this.mediaManager = mediaManager;
            this.dataService = dataService;
            this.fileService = fileService;
            this.userCreationService = userCreationService;
            this.logger = logger;
        }

        /// <summary>
        /// Hide or show command in context menu by condition.
        /// </summary>
        /// <param name="context">Context item.</param>
        /// <returns>Command state.</returns>
        public override CommandState QueryState(CommandContext context)
        {
            var item = context.Items.FirstOrDefault();

            if (item == null)
            {
                return CommandState.Hidden;
            }

            return item.TemplateID.Equals(Constants.TemplateIds.CancellationAndRefund) && IsCommandContextValid(context) ? base.QueryState(context) : CommandState.Hidden;
        }

        /// <summary>
        /// Execute command. Run a job for cancellation and refund process.
        /// </summary>
        /// <param name="context">Context item.</param>
        public override void Execute(CommandContext context)
        {
            Item item = context.Items.FirstOrDefault();
            var siteInfo = item.GetSiteInfo();
            DefaultJobOptions options = new DefaultJobOptions(Constants.Jobs.BulkToolJob.Name, "Commands", siteInfo.Name, this, nameof(Process), new object[] { item })
            {
                EnableSecurity = true,
                ContextUser = userCreationService.GetOrCreateNonAnonymousUser(GetType().Name),
                Priority = ThreadPriority.AboveNormal
            };
            Context.ClientPage.ClientResponse.Alert("Bulk cancellation and refund process started.");
            JobManager.Start(options);
        }

        /// <summary>
        /// Cheking that input file field has file.
        /// </summary>
        /// <param name="context">Command context.</param>
        /// <returns>True if input file field has file and has csv extension.</returns>
        protected internal bool IsCommandContextValid(CommandContext context)
        {
            var item = context.Items.FirstOrDefault();

            FileField file = item?.Fields[Constants.Fields.CancellationAndRefund.InputFile];

            return file?.ContainsCsvFile() ?? false;
        }

        /// <summary>
        /// Get references and their flags from csv file and run WebApi tool, recive result from WebApi, save result to ouput file.
        /// </summary>
        /// <param name="item">Context item.</param>
        private void Process(Item item)
        {
            try
            {
                item.ExecuteItemFieldAction(Constants.Fields.CancellationAndRefund.Status, field => field.Value = Constants.ProgressStatuses.InProgress);
                item.ExecuteItemFieldAction(Constants.Fields.CancellationAndRefund.Output, field => field.Value = ItemContextJobHelper.GetLogMessage("Job started"));

                string fileName = $"{ReportName}-{DateTime.Now.Ticks}.csv";

                // Request delay for every cancellation and refund request.
                int miliseconds = Settings.GetIntSetting("Booking.RequestDelay", 6000);

                var bookings = GetBookingsFromCsv(item).ToList();
                logger.Info($"Booking references: {string.Join(",", bookings?.Select(x => x?.Reference))}", this);

                var bookingResponse = new List<CancellationAndRefundResponse>();
                var status = Constants.ProgressStatuses.Success;
                bool isStopped = false;

                foreach (var booking in bookings)
                {
                    isStopped = item[Constants.Fields.CancellationAndRefund.Status] == Constants.ProgressStatuses.Cancelled;
                    if (isStopped)
                    {
                        SaveChanges(item, fileName, bookingResponse, Constants.ProgressStatuses.Cancelled);
                        return;
                    }

                    CancellationAndRefundResponse result = null;
                    try
                    {
                        result = dataService.GetCancellationAndRefundresult(booking);
                    }
                    catch (WebApiException exc)
                    {
                        status = Constants.ProgressStatuses.Failed;
                        result = new CancellationAndRefundResponse
                        {
                            CorrelationId = exc.CorrelationId,
                            Message = (!string.IsNullOrWhiteSpace(exc.ErrorCode) ? $"Code: {exc.ErrorCode}. " : string.Empty) + exc.Message,
                            Reference = string.IsNullOrWhiteSpace(exc.Reference) ? booking.Reference : exc.Reference
                        };
                    }
                    catch (Exception exc)
                    {
                        logger.Error($"Error occured while processing Booking '{booking.Reference}'", exc, this);
                        status = Constants.ProgressStatuses.Failed;
                        result = new CancellationAndRefundResponse
                        {
                            Message = exc.Message,
                            Reference = booking.Reference
                        };
                    }

                    if (status != Constants.ProgressStatuses.Failed && !string.IsNullOrWhiteSpace(result?.CorrelationId))
                    {
                        status = Constants.ProgressStatuses.Failed;
                    }

                    if (result == null)
                    {
                        bookingResponse.Add(new CancellationAndRefundResponse()
                        {
                            Message = Constants.ApiErrorMessages.NoMessage,
                            Reference = AnonymizeEmail(booking.Reference),
                            CorrelationId = Constants.ApiErrorMessages.NoCorrelationId
                        });
                    }
                    else
                    {
                        result.Reference = AnonymizeEmail(result.Reference);
                        bookingResponse.Add(result);
                    }

                    var logMessage = ItemContextJobHelper.GetLogMessage($"{result?.Message ?? Constants.ApiErrorMessages.NoMessage} | {AnonymizeEmail(result?.Reference, booking.Reference)} | {result?.CorrelationId ?? Constants.ApiErrorMessages.NoCorrelationId} | {result?.Note}");
                    item.ExecuteItemFieldAction(Constants.Fields.CancellationAndRefund.Output, (field) => field.Value += logMessage);

                    // Delay between requests, because atcom has issue with server overflow.
                    Thread.Sleep(miliseconds);
                }

                SaveChanges(item, fileName, bookingResponse, status);
            }
            catch (Exception exc)
            {
                logger.Error("Error occurred while processing Cancellation And Refund.", exc, this);
                item.ExecuteItemFieldAction(Constants.Fields.CancellationAndRefund.Output, field => field.Value += ItemContextJobHelper.GetLogMessage("Job finished"));
                item.ExecuteItemFieldAction(Constants.Fields.CancellationAndRefund.Status, field => field.Value = Constants.ProgressStatuses.Failed);
            }
        }

        /// <summary>
        /// Save processed data.
        /// </summary>
        /// <param name="item">Sitecore bulk tool item.</param>
        /// <param name="fileName">File name.</param>
        /// <param name="bookingResponse">Processed bulk tool data.</param>
        /// <param name="status">Processing status.</param>
        private void SaveChanges(Item item, string fileName, List<CancellationAndRefundResponse> bookingResponse, string status)
        {
            var data = csvUtilsService.WriteToCsv(bookingResponse);

            var reportFolder = item.Database.GetItem(ReportPath);
            var outputFileItem = fileService.SaveFileToMediaFolder(data, fileName, reportFolder);

            if (status != Constants.ProgressStatuses.Cancelled)
            {
                item.ExecuteItemFieldAction(Constants.Fields.CancellationAndRefund.InputFile, field =>
                {
                    var fileField = (FileField)field;
                    fileField.MediaItem?.Delete();
                    fileField.Clear();
                });
                item.ExecuteItemFieldAction(Constants.Fields.CancellationAndRefund.Output, field => field.Value += ItemContextJobHelper.GetLogMessage("Job finished"));
                item.ExecuteItemFieldAction(Constants.Fields.CancellationAndRefund.Status, field => field.Value = status);
            }
            else
            {
                item.ExecuteItemFieldAction(Constants.Fields.CancellationAndRefund.Output, field => field.Value += ItemContextJobHelper.GetLogMessage("Job stopped"));
            }

            item.ExecuteItemFieldAction(Constants.Fields.CancellationAndRefund.OutputFile, field =>
            {
                var fileField = (FileField)field;

                if (fileField != null && fileField.MediaID != outputFileItem.ID)
                {
                    fileField.MediaID = outputFileItem.ID;
                    fileField.Src = mediaManager.GetMediaUrl(outputFileItem, MediaUrlBuilderOptions.GetShellOptions());
                }
            });
            logger.Info($"Cancellation And Refund response: {string.Join($";{Environment.NewLine}", bookingResponse.Select(x => $"{x?.Message},{x?.Reference},{x?.CorrelationId},{x?.Note}"))}", this);
        }

        /// <summary>
        /// Read Bookings references and them flag from csv file.
        /// If csv line has specific flag then createing specified model for that.
        /// Flag is: cancel and refund, cancel, refund. Then result sholud be "Booking object".
        /// Flag is: m. Then result should be "MemoBooking object".
        /// Flag is: add credit. Then result should be "CreditBooking object".
        /// Flag is: cancel and credit. Then result should be "CancelAndCredit object".
        /// </summary>
        /// <param name="item">Cancel and refund item.</param>
        /// <returns>Collection of bookings objects.</returns>
        private IEnumerable<Models.Booking> GetBookingsFromCsv(Item item)
        {
            var fileItem = new FileField(item.Fields[Constants.Fields.CancellationAndRefund.InputFile])?.MediaItem;

            if (fileItem == null)
            {
                return Enumerable.Empty<Models.Booking>();
            }

            var bookings = new List<Models.Booking>();

            using (var mediaStream = mediaManager.GetMedia(fileItem).GetStream())
            {
                var csvRows = csvUtilsService.GetCsvRows(mediaStream.Stream);
                // Skip header row.
                foreach (var csvRow in csvRows.Skip(1))
                {
                    var booking = csvUtilsService.CreateFromCsv<Models.Booking>(csvRow);
                    switch (booking.Flag.Trim().ToLower())
                    {
                        case Constants.Commands.AddCreditCommand:
                            {
                                var creditBooking = csvUtilsService.CreateFromCsv<Models.CreditBooking>(csvRow);
                                if (!int.TryParse(creditBooking.Reference.Trim().Replace(' ', '_'), out var reference))
                                {
                                    creditBooking.Email = creditBooking.Reference;
                                }

                                bookings.Add(creditBooking);
                                break;
                            }

                        case Constants.Commands.SpendCreditCommand:
                            {
                                bookings.Add(csvUtilsService.CreateFromCsv<Models.SpendCredit>(csvRow));
                                break;
                            }

                        case Constants.Commands.CancelAndCreditCommand:
                        case Constants.Commands.UndoCreditCommand:
                            {
                                bookings.Add(csvUtilsService.CreateFromCsv<Models.CancelAndCreditBooking>(csvRow));
                                break;
                            }

                        case Constants.Commands.ModifyMemoCommand:
                            {
                                bookings.Add(csvUtilsService.CreateFromCsv<Models.MemoBooking>(csvRow));
                                break;
                            }

                        case Constants.Commands.TransferCreditCommand:
                            {
                                bookings.Add(csvUtilsService.CreateFromCsv<Models.TransferCredit>(csvRow));
                                break;
                            }

                        default:
                            {
                                bookings.Add(booking);
                                break;
                            }
                    }
                }
            }

            return bookings;
        }

        /// <summary>
        /// Anonymize reference if reference is email address.
        /// </summary>
        /// <param name="reference">Reference.</param>
        /// <returns>Anonymized email address in format "a******s@email.com" or reference.</returns>
        private string AnonymizeEmail(string reference, string fallbackReference = "")
        {
            reference = string.IsNullOrWhiteSpace(reference) ? fallbackReference : reference;
            if (!string.IsNullOrWhiteSpace(reference) && Regex.IsMatch(reference, EmailPattern))
            {
                return Regex.Replace(reference, AnonymizeEmailPattern, m => new string('*', m.Length));
            }

            return reference;
        }
    }
}