using System;
using System.Collections.Generic;
using Sitecore.XConnect;

namespace easyJet.Foundation.XConnect.Common.Services
{
    public interface ICleanContactsService
    {
        IEnumerable<Contact> CleanContacts(DateTime inactiveDateTime, bool performDeletion = false);

        IEnumerable<Interaction> CleanInteractions(DateTime startDate, bool performDeletion = false);
    }
}