namespace easyJet.Holidays.Api.Domain.Data.Transfers
{
    [Serializable]
    public class IncludedTransferType
    {
        public static string Cheapest => "Y";

        public static string NoTransfer => "N";

        public static string Private => "P";

        public static string Shared => "S";
    }
}