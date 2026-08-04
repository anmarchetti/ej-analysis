using System;
using System.Collections.Generic;
using System.Text;

namespace easyJet.Holidays.External.Atcom.Models.Internal
{
    /// <remarks/>
    [System.CodeDom.Compiler.GeneratedCodeAttribute("xsd", "4.7.3081.0")]
    [System.SerializableAttribute()]
    [System.Diagnostics.DebuggerStepThroughAttribute()]
    [System.ComponentModel.DesignerCategoryAttribute("code")]
    [System.Xml.Serialization.XmlTypeAttribute(AnonymousType = true, Namespace = "AtComRes/DisplayMemoResponse")]
    [System.Xml.Serialization.XmlRootAttribute(Namespace = "AtComRes/DisplayMemoResponse", IsNullable = false)]
    public partial class DisplayMemoResponse : AtcomresBaseResponse
    {

        /// <remarks/>
        [System.Xml.Serialization.XmlElementAttribute(Namespace = "AtComRes/Common")]
        public BkgNum BkgNum;

        /// <remarks/>
        [System.Xml.Serialization.XmlElementAttribute("Memo", Namespace = "AtComRes/Common")]
        public Memo[] Memo;
    }
}
