import PropTypes from "prop-types";
import React from "react";
import ReactDOM from "react-dom";
import {
  ALG_GOST12_256, ALG_GOST12_512,
  KEY_USAGE_ENCIPHERMENT, KEY_USAGE_SIGN, KEY_USAGE_SIGN_AND_ENCIPHERMENT,
} from "../../constants";

interface IKeyUsage {
  cRLSign: boolean;
  dataEncipherment: boolean;
  decipherOnly: boolean;
  digitalSignature: boolean;
  encipherOnly: boolean;
  keyAgreement: boolean;
  keyEncipherment: boolean;
  keyCertSign: boolean;
  nonRepudiation: boolean;
  [key: string]: boolean;
}

interface IExtendedKeyUsage {
  "1.3.6.1.5.5.7.3.1": boolean;
  "1.3.6.1.5.5.7.3.2": boolean;
  "1.3.6.1.5.5.7.3.3": boolean;
  "1.3.6.1.5.5.7.3.4": boolean;
  [key: string]: boolean;
}

interface IKeyParametersProps {
  algorithm: string;
  caTemplates?: any[];
  containerName: string;
  exportableKey: boolean;
  extKeyUsage: IExtendedKeyUsage;
  formVerified: boolean;
  keyLength: number;
  keyUsage: IKeyUsage;
  keyUsageGroup: string;
  handleAlgorithmChange: (ev: any) => void;
  handleCATemplateChange?: (ev: any) => void;
  handleInputChange: (ev: any) => void;
  handleKeyUsageChange: (ev: any) => void;
  handleKeyUsageGroupChange: (ev: any) => void;
  handleExtendedKeyUsageChange: (ev: any) => void;
  toggleExportableKey: () => void;
  disabled: boolean;
}

class KeyParameters extends React.Component<IKeyParametersProps, {}> {
  static contextTypes = {
    locale: PropTypes.string,
    localize: PropTypes.func,
  };

  componentDidMount() {
    /* https://github.com/facebook/react/issues/3667
    * fix onChange for < select >
    */
    $(document).ready(() => {
      $("select").material_select();
    });

    $(document).ready(function () {
      $(".tooltipped").tooltip();
    });

    $(ReactDOM.findDOMNode(this.refs.algorithmSelect)).on("change", this.props.handleAlgorithmChange);
    $(ReactDOM.findDOMNode(this.refs.keyUsageGroup)).on("change", this.props.handleKeyUsageGroupChange);

    if (this.props.handleCATemplateChange) {
      $(ReactDOM.findDOMNode(this.refs.templateSelect)).on("change", this.props.handleCATemplateChange);
    }

    $(document).on("ready", function() {
      Materialize.updateTextFields();
    });

    try {
      Materialize.updateTextFields();
    } catch (e) {
      //
    }
  }

  componentDidUpdate() {
    Materialize.updateTextFields();
  }

  componentWillUnmount() {
    $(".tooltipped").tooltip("remove");
  }

  render() {
    const { localize, locale } = this.context;
    const { algorithm, caTemplates, containerName, exportableKey, extKeyUsage, keyUsage, keyUsageGroup,
      handleAlgorithmChange, handleCATemplateChange, handleExtendedKeyUsageChange,
      handleInputChange, handleKeyUsageChange, handleKeyUsageGroupChange, toggleExportableKey } = this.props;

    return (
      <div className="row nobottom">
        <div className="row">
          <div className="input-field input-field-csr col s6">
            <select className="select" ref="algorithmSelect" value={algorithm} onChange={handleAlgorithmChange} >>
              <option value={ALG_GOST12_256}>{localize("Algorithm.id_tc26_gost3410_12_256", locale)}</option>
              <option value={ALG_GOST12_512}>{localize("Algorithm.id_tc26_gost3410_12_512", locale)}</option>
            </select>
            <label>{localize("CSR.algorithm", locale)}</label>
          </div>
          <div className="input-field input-field-csr col s6">
            <input
              id="containerName"
              type="text"
              className={containerName.trim().length > 0 ? "valid" : "invalid"}
              name="containerName"
              value={containerName}
              onChange={handleInputChange}
            />
            <label htmlFor="containerName">
              {localize("CSR.container", locale) + " *"}
            </label>
          </div>
        </div>
        {
          handleCATemplateChange && caTemplates && caTemplates.length ?
            <React.Fragment>
              <div className="input-field input-field-csr col s12">
                <select className="select" ref="templateSelect" name="templateSelect" onChange={handleCATemplateChange} >
                  <option disabled selected >Выберите шаблон</option>
                  {
                    caTemplates.map((template) =>
                      <option key={template.Oid} value={template.Oid}>
                        {template.LocalizedName}
                      </option>)
                  }
                </select>
                <label>{localize("CA.cert_template", locale)} *</label>
              </div>
              <div className="row" />
            </React.Fragment> :
            null
        }
        <div className="row nobottom">
          <div className="col s6 input-field input-field-csr">
            <select className="select" ref="keyUsageGroup" value={keyUsageGroup} name="keyUsageGroup" onChange={handleKeyUsageGroupChange} >
              <option value={KEY_USAGE_SIGN}>{localize("CSR.key_usage_sign", locale)}</option>
              <option value={KEY_USAGE_ENCIPHERMENT}>{localize("CSR.key_usage_encrypt", locale)}</option>
              <option value={KEY_USAGE_SIGN_AND_ENCIPHERMENT}>{localize("CSR.key_usage_sign_encrypt", locale)}</option>
            </select>
            <label>{localize("CSR.key_usage_group", locale)}</label>
          </div>
          <div className="col s6 input-radio input-field-csr">
            <div className="row halftop" />
            <input
              name="exportableKey"
              className="filled-in"
              type="checkbox"
              id="exportableKey"
              checked={exportableKey}
              onChange={toggleExportableKey}
            />
            <label htmlFor="exportableKey" className="truncate tooltipped" data-position="right" data-tooltip={localize("CSR.exportable_key", locale)}>
              {localize("CSR.exportable_key", locale)}
            </label>
          </div>
        </div>

        <div className="row nobottom">
          <div className="col s6">
            <p className="label-csr">
              {localize("CSR.key_usage", locale)}
            </p>
            <div className="z-depth-1">
              <div className="row">
                <div className="col s12">
                  <div className="row halfbottom" />
                  <div className="input-checkbox">
                    <input
                      name="dataEncipherment"
                      type="checkbox"
                      id="dataEncipherment"
                      className="filled-in"
                      checked={keyUsage.dataEncipherment}
                      disabled={keyUsageGroup === KEY_USAGE_SIGN}
                      onChange={handleKeyUsageChange}
                    />
                    <label htmlFor="dataEncipherment" className="truncate tooltipped" data-position="right" data-tooltip={localize("CSR.key_usage_dataEncipherment", locale)}>
                      {localize("CSR.key_usage_dataEncipherment", locale)}
                    </label>
                  </div>
                  <div className="input-checkbox">
                    <input
                      name="keyAgreement"
                      type="checkbox"
                      id="keyAgreement"
                      className="filled-in"
                      checked={keyUsage.keyAgreement}
                      disabled={keyUsageGroup === KEY_USAGE_SIGN}
                      onChange={handleKeyUsageChange}
                    />
                    <label htmlFor="keyAgreement" className="truncate tooltipped" data-position="right" data-tooltip={localize("CSR.key_usage_keyAgreement", locale)}>
                      {localize("CSR.key_usage_keyAgreement", locale)}
                    </label>
                  </div>
                  <div className="input-checkbox">
                    <input
                      name="keyCertSign"
                      type="checkbox"
                      id="keyCertSign"
                      className="filled-in"
                      checked={keyUsage.keyCertSign}
                      onChange={handleKeyUsageChange}
                    />
                    <label htmlFor="keyCertSign" className="truncate tooltipped" data-position="right" data-tooltip={localize("CSR.key_usage_keyCertSign", locale)}>
                      {localize("CSR.key_usage_keyCertSign", locale)}
                    </label>
                  </div>
                  <div className="input-checkbox">
                    <input
                      name="decipherOnly"
                      type="checkbox"
                      id="decipherOnly"
                      className="filled-in"
                      checked={keyUsage.decipherOnly}
                      disabled={true}
                      onChange={handleKeyUsageChange}
                    />
                    <label htmlFor="decipherOnly" className="truncate tooltipped label" data-position="right" data-tooltip={localize("CSR.key_usage_decipherOnly", locale)}>
                      {localize("CSR.key_usage_decipherOnly", locale)}
                    </label>
                  </div>
                  <div className="input-checkbox">
                    <input
                      name="encipherOnly"
                      type="checkbox"
                      id="encipherOnly"
                      className="filled-in"
                      checked={keyUsage.encipherOnly}
                      disabled={keyUsageGroup === KEY_USAGE_SIGN}
                      onChange={handleKeyUsageChange}
                    />
                    <label htmlFor="encipherOnly" className="truncate tooltipped label" data-position="right" data-tooltip={localize("CSR.key_usage_encipherOnly", locale)}>
                      {localize("CSR.key_usage_encipherOnly", locale)}
                    </label>
                  </div>
                  <div className="input-checkbox">
                    <input
                      name="digitalSignature"
                      type="checkbox"
                      id="digitalSignature"
                      className="filled-in"
                      checked={keyUsage.digitalSignature}
                      disabled={keyUsageGroup === KEY_USAGE_ENCIPHERMENT}
                      onChange={handleKeyUsageChange}
                    />
                    <label htmlFor="digitalSignature" className="truncate tooltipped" data-position="right" data-tooltip={localize("CSR.key_usage_digitalSignature", locale)}>
                      {localize("CSR.key_usage_digitalSignature", locale)}
                    </label>
                  </div>
                  <div className="input-checkbox">
                    <input
                      name="nonRepudiation"
                      type="checkbox"
                      id="nonRepudiation"
                      className="filled-in"
                      checked={keyUsage.nonRepudiation}
                      disabled={keyUsageGroup === KEY_USAGE_ENCIPHERMENT}
                      onChange={handleKeyUsageChange}
                    />
                    <label htmlFor="nonRepudiation" className="truncate tooltipped" data-position="right" data-tooltip={localize("CSR.key_usage_nonRepudiation", locale)}>
                      {localize("CSR.key_usage_nonRepudiation", locale)}
                    </label>
                  </div>
                  <div className="input-checkbox">
                    <input
                      name="cRLSign"
                      type="checkbox"
                      id="cRLSign"
                      className="filled-in"
                      checked={keyUsage.cRLSign}
                      disabled={keyUsageGroup === KEY_USAGE_ENCIPHERMENT}
                      onChange={handleKeyUsageChange}
                    />
                    <label htmlFor="cRLSign" className="truncate tooltipped" data-position="right" data-tooltip={localize("CSR.key_usage_cRLSign", locale)}>
                      {localize("CSR.key_usage_cRLSign", locale)}
                    </label>
                  </div>
                  <div className="input-checkbox">
                    <input
                      name="keyEncipherment"
                      type="checkbox"
                      id="keyEncipherment"
                      className="filled-in"
                      checked={keyUsage.keyEncipherment}
                      disabled={keyUsageGroup === KEY_USAGE_SIGN}
                      onChange={handleKeyUsageChange}
                    />
                    <label htmlFor="keyEncipherment" className="truncate tooltipped" data-position="right" data-tooltip={localize("CSR.key_usage_keyEncipherment", locale)}>
                      {localize("CSR.key_usage_keyEncipherment", locale)}
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col s6">
            <p className="label-csr">
              {localize("CSR.extKeyUsage", locale)}
            </p>
            <div className="z-depth-1">
              <div className="row">
                <div className="col s12">
                  <div className="row halfbottom" />
                  <div className="input-checkbox">
                    <input
                      name="1.3.6.1.5.5.7.3.1"
                      type="checkbox"
                      id="1.3.6.1.5.5.7.3.1"
                      className="filled-in"
                      checked={extKeyUsage["1.3.6.1.5.5.7.3.1"]}
                      onChange={handleExtendedKeyUsageChange}
                    />
                    <label htmlFor="1.3.6.1.5.5.7.3.1" className="truncate tooltipped" data-position="right" data-tooltip="1.3.6.1.5.5.7.3.1">
                      {localize("CSR.eku_serverAuth", locale)}
                    </label>
                  </div>
                  <div className="input-checkbox">
                    <input
                      name="1.3.6.1.5.5.7.3.2"
                      type="checkbox"
                      id="1.3.6.1.5.5.7.3.2"
                      className="filled-in"
                      checked={extKeyUsage["1.3.6.1.5.5.7.3.2"]}
                      onChange={handleExtendedKeyUsageChange}
                      disabled= { this.props.disabled }
                    />
                    <label htmlFor="1.3.6.1.5.5.7.3.2" className="truncate tooltipped" data-position="right" data-tooltip="1.3.6.1.5.5.7.3.2">
                      {localize("CSR.eku_clientAuth", locale)}
                    </label>
                  </div>
                  <div className="input-checkbox">
                    <input
                      name="1.3.6.1.5.5.7.3.3"
                      type="checkbox"
                      id="1.3.6.1.5.5.7.3.3"
                      className="filled-in"
                      checked={extKeyUsage["1.3.6.1.5.5.7.3.3"]}
                      onChange={handleExtendedKeyUsageChange}
                    />
                    <label htmlFor="1.3.6.1.5.5.7.3.3" className="truncate tooltipped" data-position="right" data-tooltip="1.3.6.1.5.5.7.3.3">
                      {localize("CSR.eku_codeSigning", locale)}
                    </label>
                  </div>
                  <div className="input-checkbox">
                    <input
                      name="1.3.6.1.5.5.7.3.4"
                      type="checkbox"
                      id="1.3.6.1.5.5.7.3.4"
                      className="filled-in"
                      checked={extKeyUsage["1.3.6.1.5.5.7.3.4"]}
                      onChange={handleExtendedKeyUsageChange}
                    />
                    <label htmlFor="1.3.6.1.5.5.7.3.4" className="truncate tooltipped" data-position="right" data-tooltip="1.3.6.1.5.5.7.3.4">
                      {localize("CSR.eku_emailProtection", locale)}
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default KeyParameters;
