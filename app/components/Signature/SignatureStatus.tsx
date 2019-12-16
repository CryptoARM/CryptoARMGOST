import PropTypes from "prop-types";
import React from "react";
import { localizeAlgorithm } from "../../i18n/localize";
import CertificateChainInfo from "../Certificate/CertificateChainInfo";
import OcspInfo from "./OcspInfo";
import TimestampInfo from "./TimestampInfo";
import TimestampTypeSelector from "./TimestampTypeSelector";

interface ISignatureStatusProps {
  signature: any;
  handleActiveCert: (cert: any) => void;
}

interface ISignatureStatusState {
  isShowTimeStamps: boolean;
}

class SignatureStatus extends React.Component<ISignatureStatusProps, ISignatureStatusState> {
  static contextTypes = {
    locale: PropTypes.string,
    localize: PropTypes.func,
  };

  constructor(props: ISignatureStatusProps) {
    super(props);

    this.state = {
      isShowTimeStamps: false,
    };
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
    const isHaveTimeStamps = this.isHaveTimeStamps(signature);

    const dateSigningTime = new Date(signature.signingTime);
    dateSigningTime.setHours(dateSigningTime.getHours() + 3);

    return (
      <div className="row halfbottom" onClick={this.handleClick}>
        <div className="col s2" style={{ width: "11%" }}>
          <div className={icon} />
        </div>
        <div className="col s10 ">
          <div className={isHaveTimeStamps ? "col s10" : "col s12"}>
            <div className={isValid}>{status}</div>

            <div className="collection-info">{localize("Sign.signingTime", locale)}: {signature.signingTime ? (new Date(dateSigningTime)).toLocaleString(locale, {
              day: "numeric",
              hour: "numeric",
              minute: "numeric",
              month: "long",
              year: "numeric",
            }) : "-"}</div>
          </div>
          {
            isHaveTimeStamps ?
              <div className="col s2">
                <a className={`btn-floating btn-medium waves-effect waves-light ${this.state.isShowTimeStamps ? "blue lighten-1" : "grey lighten-1"}`}
                  onClick={this.toggleShowTimestamp}
                >
                  <i className="material-icons">access_time</i>
                </a>
              </div>
              : null
          }
        </div>

        <div className="row" />

        {
          this.state.isShowTimeStamps ?
            <div>
              <TimestampTypeSelector />
              <TimestampInfo timestamp={signature.timestamps[0]} />
            </div>
            :
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

              {signature.ocsp && signature.ocsp.OCSP ?
                <React.Fragment>
                  <div className="col s12">
                    <div className="primary-text">{localize("Ocsp.ocsp_response", locale)}</div>
                    <hr />
                  </div>
                  <div className="col s12">
                    <OcspInfo ocsp={signature.ocsp} />
                  </div>
                </React.Fragment> :
                null
              }

            </div>
        }
      </div>
    );
  }

  toggleShowTimestamp = () => {
    this.setState({ isShowTimeStamps: !this.state.isShowTimeStamps });
  }

  isHaveTimeStamps = (signature: any) => {
    return signature && signature.timestamps && signature.timestamps.length;
  }
}

export default SignatureStatus;
