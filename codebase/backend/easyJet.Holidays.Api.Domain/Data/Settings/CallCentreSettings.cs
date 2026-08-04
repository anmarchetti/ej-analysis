namespace easyJet.Holidays.Api.Domain.Data.Settings
{
    public class CallCentreSettings
    {
        public bool Enabled { get; set; }
        public string Key { get; set; }
        public CallCentreCommandsSettings Commands { get; set; }
        public string[] Currencies { get; set; }
    }

    /// <summary>
    /// Call Centre commands.
    /// </summary>
    public class CallCentreCommandsSettings
    {
        /// <summary>
        /// Give credit to user command.
        /// </summary>
        public string GiveCreditCommand { get; set; }

        public string PartialRefundCommand { get; set; }
    }
}
