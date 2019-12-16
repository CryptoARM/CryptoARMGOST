import * as fs from "fs";
import PropTypes from "prop-types";
import React from "react";
import { BASE64 } from "../../constants";
import { fileExists } from "../../utils";
import EncodingTypeSelector from "../EncodingTypeSelector";

interface ICertificateExportState {
  exportPrivateKey: boolean;
  encodingType: string;
  isHaveExportablePrivateKey: boolean;
  password: string;
  passwordConfirm: string;
}

interface ICertificateExportProps {
  certificate: any;
  onSuccess?: () => void;
  onFail?: () => void;
  onCancel?: () => void;
}

const DIALOG = window.electron.remote.dialog;

class CertificateExport extends React.Component<ICertificateExportProps, ICertificateExportState> {
  static contextTypes = {
    locale: PropTypes.string,
    localize: PropTypes.func,
  };

  constructor(props: ICertificateExportProps) {
    super(props);

    this.state = ({
      encodingType: BASE64,
      exportPrivateKey: false,
      isHaveExportablePrivateKey: false,
      password: "",
      passwordConfirm: "",
    });
  }

  componentDidMount() {
    const { certificate } = this.props;

    if (certificate) {
      const exportable = this.getStatusExportablePrivateKey(certificate);

      this.setState({ isHaveExportablePrivateKey: exportable });
    }
  }

  render() {
    const { exportPrivateKey, isHaveExportablePrivateKey, password, passwordConfirm } = this.state;
    const { localize, locale } = this.context;

    let disabled = "";

    if (exportPrivateKey && (!password || !passwordConfirm || (password !== passwordConfirm))) {
      disabled = "disabled";
    }

    const disabledExportKey = isHaveExportablePrivateKey ? false : true;

    return (
      <div className="row halftop">
        <div className="col s12">
          <div className="content-wrapper tbody border_group">
            <div className="row">
              <div className="col s12">
                <span className="card-infos sub">
                  <div className="row" />
                  {this.getMessage()}
                </span>
              </div>
            </div>
            <div className="row nobottom">
              <div className="col s12">
                <span className="card-title sub">
                  {localize("Export.export_private_key_with_certificate", locale)}?
            </span>
              </div>
            </div>
            <div className="row">
              <div className="col s12">
                <form action="#">
                  <p>
                    <input name="exportKey" type="radio" id="isExportPrivateKey" disabled={disabledExportKey}
                      checked={this.state.exportPrivateKey}
                      onClick={() => this.handleExportPrivateKey(true)} />
                    <label htmlFor="isExportPrivateKey" >
                      {localize("Export.export_private_key", locale)}
                    </label>
                  </p>
                  <p>
                    <input name="exportKey" type="radio" id="isNotExportPrivateKey"
                      checked={!this.state.exportPrivateKey}
                      onClick={() => this.handleExportPrivateKey(false)} />
                    <label htmlFor="isNotExportPrivateKey">
                      {localize("Export.no_export_private_key", locale)}
                    </label>
                  </p>
                </form>
              </div>
            </div>
            <div className="row">
              <div className="col s12">
                <span className="card-title sub">
                  {exportPrivateKey ? localize("Export.export_set_password", locale) : localize("Export.export_set_encoding", locale)}:
            </span>
              </div>
            </div>
            {this.getBody()}
          </div>
        </div>

        <div className="row halfbottom" />

        <div className="row halfbottom">
          <div style={{ float: "right" }}>
            <div style={{ display: "inline-block", margin: "10px" }}>
              <a className={"btn btn-text waves-effect waves-light modal-close "} onClick={this.handelCancel}>{localize("Common.cancel", locale)}</a>
            </div>
            <div style={{ display: "inline-block", margin: "10px" }}>
              <a className={"btn btn-outlined waves-effect waves-light modal-close " + disabled} onClick={this.handleExport}>{localize("Export.export", locale)}</a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  getMessage = (): string => {
    const { encodingType, exportPrivateKey, isHaveExportablePrivateKey } = this.state;
    const { localize, locale } = this.context;

    let message;

    if (isHaveExportablePrivateKey && exportPrivateKey) {
      message = localize("Export.export_format", locale) + ": " + localize("Export.export_format_pkcs12", locale);
    } else if (isHaveExportablePrivateKey && !exportPrivateKey) {
      message = localize("Export.export_format", locale) + ": "
        + (encodingType === BASE64 ? localize("Export.export_format_base64", locale) : localize("Export.export_format_der", locale));
    } else {
      message = localize("Export.export_format", locale) + ": "
        + (encodingType === BASE64 ? localize("Export.export_format_base64", locale) : localize("Export.export_format_der", locale));
    }

    return message;
  }

  getBody = () => {
    const { encodingType, exportPrivateKey, isHaveExportablePrivateKey, password, passwordConfirm } = this.state;
    const { certificate } = this.props;
    const { localize, locale } = this.context;

    let body;
    let activePassword = "";
    let activePasswordConfirm = "";

    if (password && password.length > 0) {
      activePassword = "active";
    }

    if (passwordConfirm && passwordConfirm.length > 0) {
      activePasswordConfirm = "active";
    }

    if (isHaveExportablePrivateKey && exportPrivateKey) {
      let valid = "";

      if (passwordConfirm) {
        valid = (password === passwordConfirm) ? "valid" : "invalid";
      }

      body = (
        <div className="row">
          <div className="row">
            <div className="input-field col s6">
              <input className={valid} id="input_password_first" type="password" value={this.state.password} onChange={(ev) => this.handlePasswordChange(ev.target.value)} />
              <label htmlFor="input_password_first" className={activePassword}>{localize("Settings.password", locale)}</label>
            </div>
            <div className="input-field col s6">
              <input className={valid} id="input_password_confirm" type="password" value={this.state.passwordConfirm} onChange={(ev) => this.handlePasswordConfirmChange(ev.target.value)} />
              <label htmlFor="input_password_confirm" className={activePasswordConfirm} data-error="пароли не совпадают">{localize("Settings.password_confirm", locale)}</label>
            </div>
          </div>
        </div>
      );
    } else {
      body = (
        <React.Fragment>
          <div className="row">
            <div className="col s6 card-infos sub">
              <EncodingTypeSelector EncodingValue={encodingType} handleChange={(encoding: string) => this.handleEncodingChange(encoding)} />
              <div className="row" />
            </div>
          </div>
        </React.Fragment>
      );
    }

    return body;
  }

  handleExportPrivateKey = (exportKey: boolean) => {
    this.setState({ exportPrivateKey: exportKey });
  }

  handlePasswordChange = (password: string) => {
    const { localize, locale } = this.context;
    const pattern = /^[0-9a-z!@#$%^&*]+$/i;

    if (pattern.test(password) || !password) {
      this.setState({ password });
    } else {
      $(".toast-pattern_failed").remove();
      Materialize.toast(localize("Settings.pattern_failed", locale), 2000, "toast-pattern_failed");
    }
  }

  handlePasswordConfirmChange = (passwordConfirm: string) => {
    const { localize, locale } = this.context;
    const pattern = /^[0-9a-z!@#$%^&*]+$/i;

    if (pattern.test(passwordConfirm) || !passwordConfirm) {
      this.setState({ passwordConfirm });
    } else {
      $(".toast-pattern_failed").remove();
      Materialize.toast(localize("Settings.pattern_failed", locale), 2000, "toast-pattern_failed");
    }
  }

  handleEncodingChange = (encoding: string) => {
    this.setState({ encodingType: encoding });
  }

  getStatusExportablePrivateKey = (certificate: any): boolean => {
    let exportable: boolean = false;

    if (certificate) {
      if (certificate.category === "MY" && certificate.key) {
        try {
          const x509 = window.PKISTORE.getPkiObject(certificate);
          exportable = trusted.utils.Csp.isHaveExportablePrivateKey(x509);
        } catch (e) {
          // console.log("error get container by certificate", e);
        }
      }
    }

    return exportable;
  }

  handleExport = () => {
    const { encodingType, exportPrivateKey, isHaveExportablePrivateKey, password } = this.state;
    const { certificate, onCancel, onFail, onSuccess } = this.props;
    const { localize, locale } = this.context;

    const CER = "CER";
    const PKCS12 = "PKCS12";

    let extension = "cer";
    let outFormat = CER;

    if (isHaveExportablePrivateKey && exportPrivateKey) {
      extension = "pfx";
      outFormat = PKCS12;
    }

    const outFilePAth = DIALOG.showSaveDialog({
      defaultPath: "export." + extension,
      filters: [{ name: localize("Certificate.certs", locale), extensions: [extension] }],
      title: localize("Certificate.export_cert", locale),
    });

    let tcert: trusted.pki.Certificate | undefined;

    if (certificate.x509 && certificate.dssUserID) {
      try {
        tcert = new trusted.pki.Certificate();
        tcert.import(Buffer.from(certificate.x509), trusted.DataFormat.PEM);
      } catch (e) {
        //
      }
    }

    const x509 = certificate.x509 ? tcert : window.PKISTORE.getPkiObject(certificate);

    if (outFilePAth && x509) {
      try {
        switch (outFormat) {
          case CER:
            const encoding = encodingType === BASE64 ? trusted.DataFormat.PEM : trusted.DataFormat.DER;
            x509.save(outFilePAth, encoding);
            break;
          case PKCS12:
            const p12 = trusted.utils.Csp.certToPkcs12(x509, true, password);
            p12.save(outFilePAth);
            break;
        }
      } catch (e) {
        $(".toast-cert_export_failed").remove();
        Materialize.toast(localize("Certificate.cert_export_failed", locale), 2000, "toast-cert_export_failed");

        if (fileExists(outFilePAth)) {
          fs.unlinkSync(outFilePAth);
        }

        if (onFail) {
          onFail();
        }

        return;
      }

      if (onSuccess) {
        onSuccess();
      }

      $(".toast-cert_export_ok").remove();
      Materialize.toast(localize("Certificate.cert_export_ok", locale), 2000, "toast-cert_export_ok");
    } else {
      if (onCancel) {
        onCancel();
      }

      $(".toast-cert_export_cancel").remove();
      Materialize.toast(localize("Certificate.cert_export_cancel", locale), 2000, "toast-cert_export_cancel");
    }
  }

  handelCancel = () => {
    const { onCancel } = this.props;
    const { localize, locale } = this.context;

    if (onCancel) {
      onCancel();
    }

    $(".toast-cert_export_cancel").remove();
    Materialize.toast(localize("Certificate.cert_export_cancel", locale), 2000, "toast-cert_export_cancel");
  }
}

export default CertificateExport;
