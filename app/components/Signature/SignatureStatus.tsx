import PropTypes from "prop-types";
import React from "react";
import { localizeAlgorithm } from "../../i18n/localize";
import CertificateChainInfo from "../Certificate/CertificateChainInfo";

interface ISignatureStatusProps {
  signature: any;
  handleActiveCert: (cert: any) => void;
}

class SignatureStatus extends React.Component<ISignatureStatusProps, null> {
  static contextTypes = {
    locale: PropTypes.string,
    localize: PropTypes.func,
  };

  constructor(props: ISignatureStatusProps) {
    super(props);
  }

  handleClick = () => {
    const { signature, handleActiveCert } = this.props;

    handleActiveCert(signature.certs[0]);
  }

  render() {
    const { signature } = this.props;
    const { localize, locale } = this.context;

    let status = "";
    let icon = "";
    let isValid = "";

    if (signature.status_verify === true) {
      status = localize("Sign.sign_ok", locale);
      icon = "status_ok_icon";
      isValid = "valid";
    } else {
      status = localize("Sign.sign_error", locale);
      icon = "status_error_icon";
      isValid = "unvalid";
    }

    const signerCert = signature.certs[signature.certs.length - 1];
    const dateSigningTime = new Date(signature.signingTime);
    dateSigningTime.setHours(dateSigningTime.getHours());

    return (
      <div className="row halfbottom" onClick={this.handleClick}>
        <div className="col s12 primary-text">Свойства подписи:</div>
        <div className="col s12 ">
          <div className={"col s12"}>
            <div className="collection-info">{localize("Sign.signingTime", locale)}: {signature.signingTime ? (new Date(dateSigningTime)).toLocaleString(locale, {
              day: "numeric",
              hour: "numeric",
              minute: "numeric",
              month: "long",
              year: "numeric",
            }) : "-"}</div>
          </div>
        </div>

        <div className="row" />

        <div className="row">
          <div className="col s12 primary-text">Сертификат подписчика:</div>
          <div className="col s12">
            <div className="collection">
              <div className="collection-item certs-collection certificate-info">
                <div className="collection-title">{signerCert.subjectFriendlyName}</div>
                <div className="collection-info">{localize("Certificate.subject", locale)}</div>
              </div>

              <div className="collection-item certs-collection certificate-info">
                <div className="collection-title">{signerCert.issuerFriendlyName}</div>
                <div className="collection-info">{localize("Certificate.issuer", locale)}</div>
              </div>

              <div className="collection-item certs-collection certificate-info">
                <div className="collection-title">{(new Date(signerCert.notAfter)).toLocaleDateString(locale, {
                  day: "numeric",
                  hour: "numeric",
                  minute: "numeric",
                  month: "long",
                  year: "numeric",
                })}</div>
                <div className="collection-info">{localize("Certificate.cert_valid", locale)}</div>
              </div>

              <div className="collection-item certs-collection certificate-info">
                <div className="collection-title">{localizeAlgorithm(signature.alg, locale)}</div>
                <div className="collection-info">{localize("Sign.alg", locale)}</div>
              </div>

            </div>
          </div>

          <div className="row" />

          <div className="col s12">
            <a className="primary-text">{localize("Certificate.cert_chain_info", locale)}</a>
            <CertificateChainInfo certificate={signerCert} style="" onClick={() => { return; }} />
          </div>

          <div className="row" />
        </div>
      </div>
    );
  }
}

export default SignatureStatus;
