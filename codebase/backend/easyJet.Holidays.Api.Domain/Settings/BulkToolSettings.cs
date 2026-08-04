namespace easyJet.Holidays.Api.Domain.Settings
{
    /// <summary>
    /// Bulk tools commands.
    /// </summary>
    public class CommandsSettings
    {
        /// <summary>
        /// Cancel and refund command.
        /// </summary>
        public string CancelAndRefundCommand { get; set; }

        /// <summary>
        /// Cancel command.
        /// </summary>
        public string CancelCommand { get; set; }

        /// <summary>
        /// Refund command.
        /// </summary>
        public string RefundCommand { get; set; }

        /// <summary>
        /// Modify memo command.
        /// </summary>
        public string ModifyMemoCommand { get; set; }

        /// <summary>
        /// Add credit to user command.
        /// </summary>
        public string AddCreditCommand { get; set; }

        /// <summary>
        /// Cancel and credit command.
        /// </summary>
        public string CancelAndCreditCommand { get; set; }

        /// <summary>
        /// Undo credit command name
        /// </summary>
        public string UndoCreditCommand { get; set; }

        /// <summary>
        /// Add customer credit to booking
        /// </summary>
        public string SpendCreditCommand { get; set; }

        /// <summary>
        /// Trnsfer credit sfrom one account to another
        /// </summary>
        public string TransferCreditCommand { get; set; }
    }
    public class BookingCodesSettings
    {
        public string BookingNotFound { get; set; }
        public string BookingAlreadyCanceled { get; set; }
    }
    public class StatusesSettings
    {
        public string Canceled { get; set; }
        public string Lock { get; set; }
        public string Quote { get; set; }
        public string Option { get; set; }
        public string Booking { get; set; }
    }
    public class MessagesSettings
    {
        public string BookingNotFound { get; set; }
        public string BookingAlreadyCanceled { get; set; }
        public string SuccessfullyCancelled { get; set; }
        public string SuccessfullyCancelledAndRefunded { get; set; }
        public string CancellationSuccessfulRefundFailed { get; set; }
        public string SuccessfullyRefunded { get; set; }
        public string FailedToRefund { get; set; }
        public string FailedToCancel { get; set; }
        public string ReasonToCancel { get; set; }
        public string FailedToAddMemo { get; set; }
        public string MemoAdded { get; set; }
        public string NoPaymentsFound { get; set; }
        public string SuccessfullyUndoCredit { get; set; }
        public string FailedUndoRefundCredit { get; set; }
    }
    public class CancelAndCreditSettings
    {
        public string DefaultReason { get; set; }
        public string DefaultMemo { get; set; }
    }
    public class AddCreditByEmailSettings
    {
        public int AttemptsLimit { get; set; }
        public int DelayMls { get; set; }
    }

    public class BulkToolSettings
    {
        /// <summary>
        /// Toggle for pending decommission, see: BOA-249
        /// </summary>
        public bool IsEnabled { get; set; }
        /// <summary>
        /// url that will be embedded in bulktool responses, referring to new bulktool
        /// </summary>
        public Uri ReferralUrl { get; set; }
        public CommandsSettings Commands { get; set; }
        public BookingCodesSettings BookingCodes { get; set; }
        public StatusesSettings Statuses { get; set; }
        public MessagesSettings Messages { get; set; }
        public CancelAndCreditSettings CancelAndCredit { get; set; }
        public AddCreditByEmailSettings AddCreditByEmail { get; set; }
        public string[] SupportedCommandsForExternalAgency { get; set; }
    }
}
