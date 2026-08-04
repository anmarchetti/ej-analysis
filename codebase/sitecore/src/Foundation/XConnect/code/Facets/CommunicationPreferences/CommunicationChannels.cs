using System;

namespace easyJet.Foundation.XConnect.Common.Facets.CommunicationPreferences
{
    [Flags]
    public enum CommunicationChannel
    {
        DoNotContact = 0,
        Email = 1,
        WhatsApp = 2,
        Twitter = 4,
        Facebook = 8,
        PushNotification = 16,
        AppNotification = 32
    }
}