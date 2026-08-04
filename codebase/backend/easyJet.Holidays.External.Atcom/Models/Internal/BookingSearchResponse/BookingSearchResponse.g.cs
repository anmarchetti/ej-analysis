using System;
using System.CodeDom.Compiler;
using System.ComponentModel;
using System.Diagnostics;
using System.Xml.Serialization;

namespace easyJet.Holidays.External.Atcom.Models.Internal
{

    /// <remarks/>
    [System.CodeDom.Compiler.GeneratedCodeAttribute("xsd", "4.8.3928.0")]
    [System.SerializableAttribute()]
    [System.Diagnostics.DebuggerStepThroughAttribute()]
    [System.ComponentModel.DesignerCategoryAttribute("code")]
    [System.Xml.Serialization.XmlTypeAttribute(AnonymousType = true, Namespace = "AtComRes/BookingSearchResponse")]
    [System.Xml.Serialization.XmlRootAttribute(Namespace = "AtComRes/BookingSearchResponse", IsNullable = false)]
    public partial class BookingSearchResponse : AtcomresBaseResponse
    {

        /// <remarks/>
        [System.Xml.Serialization.XmlElementAttribute("BookingSearchResponseEntry")]
        public BookingSearchResponseEntry[] BookingSearchResponseEntry;
    }

    /// <remarks/>
    [System.CodeDom.Compiler.GeneratedCodeAttribute("xsd", "4.8.3928.0")]
    [System.SerializableAttribute()]
    [System.Diagnostics.DebuggerStepThroughAttribute()]
    [System.ComponentModel.DesignerCategoryAttribute("code")]
    [System.Xml.Serialization.XmlTypeAttribute(AnonymousType = true, Namespace = "AtComRes/BookingSearchResponse")]
    [System.Xml.Serialization.XmlRootAttribute(Namespace = "AtComRes/BookingSearchResponse", IsNullable = false)]
    public partial class BookingSearchResponseEntry
    {

        /// <remarks/>
        [System.Xml.Serialization.XmlElementAttribute(Namespace = "AtComRes/Common")]
        public System.DateTime Bkg_Dt_Tm;

        /// <remarks/>
        [System.Xml.Serialization.XmlElementAttribute(Namespace = "AtComRes/Common")]
        public System.DateTime Amd_Dt_Tm;

        /// <remarks/>
        [System.Xml.Serialization.XmlIgnoreAttribute()]
        public bool Amd_Dt_TmSpecified;

        /// <remarks/>
        [System.Xml.Serialization.XmlElementAttribute(Namespace = "AtComRes/Common")]
        public BkgNum BkgNum;

        /// <remarks/>
        [System.Xml.Serialization.XmlElementAttribute(Namespace = "AtComRes/Common")]
        public BkgSts BkgSts;

        /// <remarks/>
        [System.Xml.Serialization.XmlElementAttribute(Namespace = "AtComRes/Common")]
        public ResSts ResSts;

        /// <remarks/>
        [System.Xml.Serialization.XmlIgnoreAttribute()]
        public bool ResStsSpecified;

        /// <remarks/>
        [System.Xml.Serialization.XmlElementAttribute(Namespace = "AtComRes/Common")]
        public string Bkg_Exp_No;

        /// <remarks/>
        public string Pax_Lastname;

        /// <remarks/>
        [System.Xml.Serialization.XmlElementAttribute(DataType = "date")]
        public System.DateTime Earliest_Startdate;

        /// <remarks/>
        [System.Xml.Serialization.XmlElementAttribute(DataType = "date")]
        public System.DateTime Latest_Enddate;

        /// <remarks/>
        [System.Xml.Serialization.XmlElementAttribute(Namespace = "AtComRes/Common")]
        public string Prd_Cd;

        /// <remarks/>
        [System.Xml.Serialization.XmlElementAttribute(Namespace = "AtComRes/Common")]
        public Prom Prom;

        /// <remarks/>
        public BookingSearchResponseEntryPay_Type Pay_Type;

        /// <remarks/>
        [System.Xml.Serialization.XmlElementAttribute(Namespace = "AtComRes/Common")]
        public string Agt_No;

        /// <remarks/>
        public string Spnr_Cd;

        /// <remarks/>
        [System.Xml.Serialization.XmlElementAttribute(Namespace = "AtComRes/Common")]
        public Reservation_Locked Reservation_Locked;

        public BookingSearchResponseEntry()
        {
            this.ResSts = ResSts.CONFIRMED;
        }
    }

    /// <remarks/>
    [System.CodeDom.Compiler.GeneratedCodeAttribute("xsd", "4.8.3928.0")]
    [System.SerializableAttribute()]
    [System.Diagnostics.DebuggerStepThroughAttribute()]
    [System.ComponentModel.DesignerCategoryAttribute("code")]
    [System.Xml.Serialization.XmlTypeAttribute(AnonymousType = true, Namespace = "AtComRes/BookingSearchResponse")]
    public partial class BookingSearchResponseEntryPay_Type
    {

        /// <remarks/>
        [System.Xml.Serialization.XmlAttributeAttribute()]
        public string CCType;

        /// <remarks/>
        [System.Xml.Serialization.XmlAttributeAttribute()]
        public string Card_Cd;

        /// <remarks/>
        [System.Xml.Serialization.XmlAttributeAttribute()]
        [System.ComponentModel.DefaultValueAttribute(false)]
        public bool AccPay;

        /// <remarks/>
        [System.Xml.Serialization.XmlAttributeAttribute()]
        [System.ComponentModel.DefaultValueAttribute(false)]
        public bool Agt_Pay;

        /// <remarks/>
        [System.Xml.Serialization.XmlAttributeAttribute()]
        [System.ComponentModel.DefaultValueAttribute(false)]
        public bool Payment_Form_Pay;

        /// <remarks/>
        [System.Xml.Serialization.XmlTextAttribute()]
        public string Value;

        public BookingSearchResponseEntryPay_Type()
        {
            this.AccPay = false;
            this.Agt_Pay = false;
            this.Payment_Form_Pay = false;
        }
    }
}
