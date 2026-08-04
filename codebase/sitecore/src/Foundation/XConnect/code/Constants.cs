using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace easyJet.Foundation.XConnect.Common
{
    public class Constants
    {
        public struct Tracking
        {
            public const string DefaultIdentifierSource = "digital";
            public const string PreferredPhoneNumberKey = "default";
            public const string PreferredEmailKey = "default";
        }

        public struct Performance
        {
            public const string XConnectBatchSize = "XConnect.BatchSize";
        }
    }
}