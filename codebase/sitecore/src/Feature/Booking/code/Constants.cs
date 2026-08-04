using Sitecore.Data;

namespace easyJet.Feature.Booking
{
    public class Constants
    {
        public struct TemplateIds
        {
            public static readonly ID CancellationAndRefund = new ID("{2503E6E5-F50F-426C-AD29-BF22A284287F}");
        }

        public struct Jobs
        {
            public class BulkToolJob
            {
                public const string Name = "Bulk cancellation and refund";
            }
        }

        public struct Fields
        {
            public class CancellationAndRefund
            {
                public const string InputFile = "InputFile";
                public const string Output = "Output";
                public const string Status = "Status";
                public const string OutputFile = "OutputFile";
            }
        }

        /// <summary>
        /// Cancellation and refund process statuses.
        /// </summary>
        public struct ProgressStatuses
        {
            public const string InProgress = "In progress";
            public const string Success = "Success";
            public const string Failed = "Failed";
            public const string Cancelled = "Cancelled";
        }

        /// <summary>
        /// Api error messages which occurred while processing.
        /// </summary>
        public struct ApiErrorMessages
        {
            public const string NoMessage = "Message could not be retrieved";
            public const string NoCorrelationId = "Correlation id could not be retrieved";
        }

        /// <summary>
        /// Cancellation and refund tool actions.
        /// </summary>
        public struct Commands
        {
            /// <summary>
            /// Add credit to customer by email command.
            /// </summary>
            public const string AddCreditCommand = "add credit";

            /// <summary>
            /// Cancel booking and credit customer.
            /// </summary>
            public const string CancelAndCreditCommand = "cancel and credit";

            /// <summary>
            /// Undo credit.
            /// </summary>
            public const string UndoCreditCommand = "undo credit";

            /// <summary>
            /// Modify booking memo command.
            /// </summary>
            public const string ModifyMemoCommand = "memo";

            /// <summary>
            /// Add credit to booking.
            /// </summary>
            public const string SpendCreditCommand = "spend credit";

            /// <summary>
            /// Transfer credit between accounts.
            /// </summary>
            public const string TransferCreditCommand = "transfer credit";
        }
    }
}