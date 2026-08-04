using System.CodeDom.Compiler;
using System.ComponentModel;
using System.Diagnostics;

namespace easyJet.Holidays.External.Atcom.Models.Internal
{
    [GeneratedCodeAttribute("xsd", "4.7.3081.0")]
    [SerializableAttribute()]
    [DebuggerStepThroughAttribute()]
    [DesignerCategoryAttribute("code")]
    [System.Xml.Serialization.XmlTypeAttribute(AnonymousType = true, Namespace = "AtComRes/InfoCancellationRequest")]
    [System.Xml.Serialization.XmlRootAttribute(Namespace = "AtComRes/InfoCancellationRequest", IsNullable = false)]
    public partial class InfoCancellationRequest : AtcomresBaseRequest
    {

        private BkgNum[] bkgNumField;

        private bool cnx_Without_FeeField;

        private bool cnx_Without_FeeFieldSpecified;

        private Bkg_Ent bkg_EntField;

        private Object[] _items;

        /// <remarks/>
        [System.Xml.Serialization.XmlElementAttribute("BkgNum", Namespace = "AtComRes/Common")]
        public BkgNum[] BkgNum
        {
            get
            {
                return this.bkgNumField;
            }
            set
            {
                this.bkgNumField = value;
            }
        }

        /// <remarks/>
        public bool Cnx_Without_Fee
        {
            get
            {
                return this.cnx_Without_FeeField;
            }
            set
            {
                this.cnx_Without_FeeField = value;
            }
        }

        /// <remarks/>
        [System.Xml.Serialization.XmlIgnoreAttribute()]
        public bool Cnx_Without_FeeSpecified
        {
            get
            {
                return this.cnx_Without_FeeFieldSpecified;
            }
            set
            {
                this.cnx_Without_FeeFieldSpecified = value;
            }
        }

        /// <remarks/>
        [System.Xml.Serialization.XmlElementAttribute(Namespace = "AtComRes/Common")]
        public Bkg_Ent Bkg_Ent
        {
            get
            {
                return this.bkg_EntField;
            }
            set
            {
                this.bkg_EntField = value;
            }
        }

        /// <remarks/>
        [System.Xml.Serialization.XmlElementAttribute("Disc", typeof(Disc), Namespace = "AtComRes/Common")]
        [System.Xml.Serialization.XmlElementAttribute("Disc_Code", typeof(string), Namespace = "AtComRes/Common")]
        public Object[] Items
        {
            get
            {
                return this._items;
            }
            set
            {
                this._items = value;
            }
        }
    }
}