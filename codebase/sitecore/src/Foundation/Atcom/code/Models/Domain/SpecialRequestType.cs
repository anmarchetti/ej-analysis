using System.Collections.Generic;

namespace easyJet.Foundation.Atcom.Models.Domain
{
    public class SpecialRequestType : DataObject
    {
        public SpecialRequestType(string code, string name)
            : base(code, name)
        {
        }

        /// <summary>
        /// Gets or sets special requests value.
        /// </summary>
        public IEnumerable<DataObject> SpecialRequests { get; set; }
    }
}