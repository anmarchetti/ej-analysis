using System;
using System.CodeDom.Compiler;
using System.ComponentModel;
using System.Diagnostics;
using System.Xml.Serialization;

namespace easyJet.Holidays.External.Atcom.Models.Internal
{
    [GeneratedCodeAttribute("xsd", "4.7.3081.0")]
    [SerializableAttribute()]
    [DebuggerStepThroughAttribute()]
    [DesignerCategoryAttribute("code")]
    [XmlTypeAttribute(AnonymousType = true, Namespace = "AtComRes/BookingRequest")]
    [XmlRootAttribute(Namespace = "AtComRes/BookingRequest", IsNullable = false)]
    public partial class BookingRequest : AtcomresBookingBaseRequest
    {

        /// <remarks/>
        [XmlElementAttribute(Namespace = "AtComRes/Common")]
        public bool ReturnServiceBreakDown;

        /// <remarks/>
        [XmlIgnoreAttribute()]
        public bool ReturnServiceBreakDownSpecified;

        /// <remarks/>
        [XmlElementAttribute(Namespace = "AtComRes/Common")]
        public PNR_Contact_Num PNR_Contact_Num;
    }
}
