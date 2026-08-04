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
    [System.Xml.Serialization.XmlTypeAttribute(AnonymousType = true, Namespace = "AtComRes/BookingSearchRequest")]
    [System.Xml.Serialization.XmlRootAttribute(Namespace = "AtComRes/BookingSearchRequest", IsNullable = false)]
    public partial class BookingSearchRequest : AtcomresBaseRequest
    {

        /// <remarks/>
        [System.Xml.Serialization.XmlElementAttribute(DataType = "date")]
        public System.DateTime Search_Bkg_From;

        /// <remarks/>
        [System.Xml.Serialization.XmlIgnoreAttribute()]
        public bool Search_Bkg_FromSpecified;

        /// <remarks/>
        [System.Xml.Serialization.XmlElementAttribute(DataType = "date")]
        public System.DateTime Search_Bkg_To;

        /// <remarks/>
        [System.Xml.Serialization.XmlIgnoreAttribute()]
        public bool Search_Bkg_ToSpecified;

        /// <remarks/>
        [System.Xml.Serialization.XmlElementAttribute(DataType = "date")]
        public System.DateTime Search_Trv_From;

        /// <remarks/>
        [System.Xml.Serialization.XmlIgnoreAttribute()]
        public bool Search_Trv_FromSpecified;

        /// <remarks/>
        [System.Xml.Serialization.XmlElementAttribute(DataType = "date")]
        public System.DateTime Search_Trv_To;

        /// <remarks/>
        [System.Xml.Serialization.XmlIgnoreAttribute()]
        public bool Search_Trv_ToSpecified;

        /// <remarks/>
        [System.Xml.Serialization.XmlElementAttribute("BkgSts", Namespace = "AtComRes/Common")]
        public BkgSts[] BkgSts;

        /// <remarks/>
        [System.Xml.Serialization.XmlElementAttribute(Namespace = "AtComRes/Common")]
        public ResSts ResSts;

        /// <remarks/>
        [System.Xml.Serialization.XmlIgnoreAttribute()]
        public bool ResStsSpecified;

        /// <remarks/>
        [System.Xml.Serialization.XmlElementAttribute(Namespace = "AtComRes/Common")]
        public string Exp_No;

        /// <remarks/>
        public string Lastname;

        /// <remarks/>
        [System.Xml.Serialization.XmlElementAttribute(Namespace = "AtComRes/Common")]
        public string Prd_Cd;

        /// <remarks/>
        [System.Xml.Serialization.XmlElementAttribute("Prom", typeof(Prom), Namespace = "AtComRes/Common")]
        [System.Xml.Serialization.XmlElementAttribute("Prom_Grp", typeof(Prom_Grp), Namespace = "AtComRes/Common")]
        public object[] Items;

        /// <remarks/>
        [System.Xml.Serialization.XmlElementAttribute(Namespace = "AtComRes/Common")]
        public Cus Cus;

        /// <remarks/>
        [System.ComponentModel.DefaultValueAttribute(false)]
        public bool Include_Pay_Types;

        /// <remarks/>
        [System.ComponentModel.DefaultValueAttribute(true)]
        public bool Return_Non_SPNRs_only;

        /// <remarks/>
        [System.ComponentModel.DefaultValueAttribute(false)]
        public bool Ignore_Agency_Cd;

        public BookingSearchRequest()
        {
            this.ResSts = ResSts.CONFIRMED;
            this.Include_Pay_Types = false;
            this.Return_Non_SPNRs_only = true;
            this.Ignore_Agency_Cd = false;
        }
    }
}