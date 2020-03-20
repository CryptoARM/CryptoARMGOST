import PropTypes from "prop-types";
import React from "react";
import { connect } from "react-redux";
import {
  deleteRecipient, selectSignerCertificate,
} from "../../AC";
import {
  changeArchiveFilesBeforeEncrypt, changeDeleteFilesAfterEncrypt, changeEncryptEncoding, changeEncryptionAlgorithm,
  changeOutfolder, changeSignatureDetached, changeSignatureEncoding,
  changeSignatureStandard, changeSignatureTime, changeSignatureTimestamp,
  changeSignatureTimestampOnSign, toggleSaveToDocuments,
} from "../../AC/settingsActions";
import {
  DEFAULT_DOCUMENTS_PATH, GOST_28147, TSP_OCSP_ENABLED,
} from "../../constants";
import { loadingRemoteFilesSelector } from "../../selectors";
import { isCsp5R2 } from "../../utils";
import { mapToArr } from "../../utils";
import CheckBoxWithLabel from "../CheckBoxWithLabel";
import EncodingTypeSelector from "../EncodingTypeSelector";
import EncryptionAlgorithmSelector from "../Encryption/EncryptionAlgorithmSelector";
import SelectFolder from "../SelectFolder";
import SignatureStandardSelector, { SignatureStandard } from "../Signature/SignatureStandardSelector";
import SignatureTypeSelector from "../Signature/SignatureTypeSelector";
import OcspSettings from "./OcspSettings";
import TspSettings from "./TspSettings";

const dialog = window.electron.remote.dialog;
const isCsp5R2orHigh = isCsp5R2();

class AllSettings extends React.Component<any, {}> {
  static contextTypes = {
    locale: PropTypes.string,
    localize: PropTypes.func,
  };

  constructor(props: any) {
    super(props);
  }

  componentDidMount() {
    // tslint:disable-next-line: no-shadowed-variable
    const { changeEncryptionAlgorithm, changeSignatureTime, changeSignatureTimestamp, changeSignatureTimestampOnSign,
      changeSignatureStandard, settings, signer } = this.props;

    $(".btn-floated, .nav-small-btn").dropdown({
      alignment: "left",
      belowOrigin: false,
      gutter: 0,
      inDuration: 300,
      outDuration: 225,
    });

    $(document).on("ready", function() {
      Materialize.updateTextFields();
    });

    try {
      Materialize.updateTextFields();
    } catch (e) {
      //
    }

    const signatureStandard = settings.sign.standard;

    if (signatureStandard === SignatureStandard.CADES) {
      changeSignatureTime(true);
      changeSignatureTimestamp(false);
      changeSignatureTimestampOnSign(true);
    }

    if (!(TSP_OCSP_ENABLED)) {
      changeSignatureStandard(SignatureStandard.CMS);
      changeSignatureTimestamp(false);
      changeSignatureTimestampOnSign(false);
    }

    if (signer && (signer.service || signer.dssUserID)) {
      changeSignatureStandard(SignatureStandard.CMS);
      changeSignatureTimestamp(false);
      changeSignatureTimestampOnSign(false);
    }

    if (!isCsp5R2orHigh) {
      changeEncryptionAlgorithm(GOST_28147);
    }
  }

  render() {
    const { localize, locale } = this.context;
    const { recipients, signer } = this.props;
    const { settings } = this.props;

    const disabled = this.getDisabled();

    let encoding = settings.sign.encoding;
    const signatureStandard = settings.sign.standard;
    const classDisabledTspAndOcsp = signatureStandard === SignatureStandard.CADES ? "" : "disabled";
    const isDetached = settings.sign.detached;

    if (signer && (signer.service || signer.dssUserID) && encoding !== "BASE-64") {
      encoding = "BASE-64";
    }

    return (
      <div className="row">
        <div className="row" />

        {
          settings.operations.signing_operation ?
            <React.Fragment>
              <div className="row">
                <div className="subtitle">
                  {localize("Sign.sign_setting", locale)}
                  <hr />
                </div>

                <div className="col s12">
                  <SignatureStandardSelector
                    value={signatureStandard}
                    handleChange={this.handleSignatureStandardChange}
                    disabled={disabled || (signer && (signer.service || signer.dssUserID)) || !(TSP_OCSP_ENABLED)} />

                  <SignatureTypeSelector
                    detached={isDetached}
                    handleChange={this.handleDetachedChange}
                    disabled={disabled} />

                  <EncodingTypeSelector
                    EncodingValue={encoding}
                    handleChange={this.handleEncodingChange} />
                </div>

                <div className="col s12">
                  <CheckBoxWithLabel
                    disabled={disabled || signatureStandard === SignatureStandard.CADES}
                    onClickCheckBox={this.handleTimeClick}
                    isChecked={signatureStandard === SignatureStandard.CADES ? true : settings.sign.time}
                    elementId="sign_time"
                    title={localize("Sign.sign_time", locale)} />

                  <CheckBoxWithLabel
                    disabled={!(TSP_OCSP_ENABLED) || signatureStandard === SignatureStandard.CADES || signer && (signer.service || signer.dssUserID)}
                    onClickCheckBox={this.handleTimestampOnSignClick}
                    isChecked={signatureStandard === SignatureStandard.CADES ? true : settings.sign.timestamp_on_sign}
                    elementId="set_timestamp_on_sign"
                    title={localize("Cades.set_timestamp_on_sign", locale)} />

                  <CheckBoxWithLabel onClickCheckBox={this.handleTimestampClick}
                    disabled={!(TSP_OCSP_ENABLED) || signatureStandard === SignatureStandard.CADES || signer && (signer.service || signer.dssUserID)}
                    isChecked={signatureStandard === SignatureStandard.CADES ? false : settings.sign.timestamp_on_data}
                    elementId="set_timestamp_on_data"
                    title={localize("Cades.set_timestamp_on_data", locale)} />
                </div>
              </div>
            </React.Fragment>
            : null
        }

        {
          settings.operations.encryption_operation ?
            <React.Fragment>
              <div className="subtitle">
                {localize("Encrypt.encrypt_setting", locale)}
              </div>
              <hr />

              <div className="col s12">
                <EncodingTypeSelector
                  EncodingValue={settings.encrypt.encoding}
                  handleChange={this.handleEncryptEncodingChange}
                  disabled={disabled}
                />

                {
                  isCsp5R2orHigh ?
                    <EncryptionAlgorithmSelector
                      disabled={disabled}
                      EncryptionValue={settings.encrypt.algorithm}
                      handleChange={this.handleEncryptAlgoritmChange} />
                    : null
                }

                <CheckBoxWithLabel
                  disabled={disabled}
                  onClickCheckBox={this.handleDeleteClick}
                  isChecked={settings.encrypt.delete}
                  elementId="delete_files"
                  title={localize("Encrypt.delete_files_after", locale)} />

              </div>

              <div className="row" />
            </React.Fragment>
            : null
        }

        {
          settings.operations.signing_operation ?
            <React.Fragment>
              <div className="subtitle">
                {localize("Cades.service_tsp", locale)}
              </div>
              <hr />

              <TspSettings />

              <div className="subtitle">
                {localize("Cades.service_ocsp", locale)}
              </div>
              <hr />

              <div className={classDisabledTspAndOcsp}>
                <OcspSettings isCades={signatureStandard === SignatureStandard.CADES} />
              </div>
            </React.Fragment>
            : null
        }

      </div>
    );
  }

  getDisabled = () => {
    const { loadingFiles, operationIsRemote } = this.props;

    if (operationIsRemote || loadingFiles && loadingFiles.length) {
      return true;
    }

    return false;
  }

  handleDetachedChange = (detached: boolean) => {
    // tslint:disable-next-line: no-shadowed-variable
    const { changeSignatureDetached } = this.props;

    changeSignatureDetached(detached);
  }

  handleTimestampClick = () => {
    // tslint:disable-next-line: no-shadowed-variable
    const { changeSignatureTimestamp, settings } = this.props;

    changeSignatureTimestamp(!settings.sign.timestamp_on_data);
  }

  handleTimeClick = () => {
    // tslint:disable-next-line: no-shadowed-variable
    const { changeSignatureTime, settings } = this.props;

    changeSignatureTime(!settings.sign.time);
  }

  handleTimestampOnSignClick = () => {
    // tslint:disable-next-line: no-shadowed-variable
    const { changeSignatureTimestampOnSign, settings } = this.props;

    changeSignatureTimestampOnSign(!settings.sign.timestamp_on_sign);
  }

  handleEncodingChange = (encoding: string) => {
    // tslint:disable-next-line: no-shadowed-variable
    const { changeSignatureEncoding } = this.props;

    changeSignatureEncoding(encoding);
  }

  handleSignatureStandardChange = (value: string) => {
    // tslint:disable-next-line: no-shadowed-variable
    const { changeSignatureTime, changeSignatureTimestamp, changeSignatureTimestampOnSign, changeSignatureStandard } = this.props;

    changeSignatureStandard(value);

    if (value === SignatureStandard.CADES) {
      changeSignatureTime(true);
      changeSignatureTimestamp(false);
      changeSignatureTimestampOnSign(true);
    }
  }

  handleEncryptEncodingChange = (encoding: string) => {
    // tslint:disable-next-line: no-shadowed-variable
    const { changeEncryptEncoding } = this.props;

    changeEncryptEncoding(encoding);
  }

  handleDeleteClick = () => {
    // tslint:disable-next-line: no-shadowed-variable
    const { changeDeleteFilesAfterEncrypt, settings } = this.props;

    changeDeleteFilesAfterEncrypt(!settings.encrypt.delete);
  }

  handleEncryptAlgoritmChange = (value: string) => {
    // tslint:disable-next-line: no-shadowed-variable
    const { changeEncryptionAlgorithm } = this.props;

    changeEncryptionAlgorithm(value);
  }
}

export default connect((state) => {
  return {
    files: mapToArr(state.files.entities),
    loadingFiles: loadingRemoteFilesSelector(state, { loading: true }),
    recipients: mapToArr(state.settings.getIn(["entities", state.settings.active]).encrypt.recipients)
      .map((recipient) => state.certificates.getIn(["entities", recipient.certId]))
      .filter((recipient) => recipient !== undefined),
    settings: state.settings.getIn(["entities", state.settings.active]),
    signer: state.certificates.getIn(["entities", state.settings.getIn(["entities", state.settings.active]).sign.signer]),
    operationIsRemote: state.operation.operationIsRemote,
  };
}, {
  changeArchiveFilesBeforeEncrypt, changeEncryptionAlgorithm, changeDeleteFilesAfterEncrypt, changeEncryptEncoding, changeOutfolder,
  changeSignatureDetached, changeSignatureEncoding, changeSignatureStandard, changeSignatureTime,
  changeSignatureTimestamp, changeSignatureTimestampOnSign, toggleSaveToDocuments,
  deleteRecipient, selectSignerCertificate,
})(AllSettings);
