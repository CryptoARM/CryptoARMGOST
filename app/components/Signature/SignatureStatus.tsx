import PropTypes from "prop-types";
import React from "react";
import { localizeAlgorithm } from "../../i18n/localize";
import CertificateChainInfo from "../Certificate/CertificateChainInfo";
import NameInfo from "../Certificate/NameInfo";
import OcspInfo from "./OcspInfo";
import { SignatureStandard } from "./SignatureStandardSelector";
import TimestampInfo from "./TimestampInfo";
import TimestampTypeSelector from "./TimestampTypeSelector";

interface ISignatureStatusProps {
  signature: any;
  handleActiveCert: (cert: any) => void;
}

interface ISignatureStatusState {
  isShowTimeStamps: boolean;
  currentStampType: string;
  chain: trusted.pki.CertificateCollection | null;
}

class SignatureStatus extends React.Component<ISignatureStatusProps, ISignatureStatusState> {
  static contextTypes = {
    locale: PropTypes.string,
    localize: PropTypes.func,
  };

  constructor(props: ISignatureStatusProps) {
    super(props);

    this.state = {
      chain: null,
      currentStampType: "1",
      isShowTimeStamps: false,
    };
  }
  componentDidMount() {
    const { signature } = this.props;
    const signerCert = signature.certs[signature.certs.length - 1];

    if (signerCert) {
      const chain = this.buildChain(signerCert);

      this.setState({ chain });
    }
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
    const timeStampTypes = this.getTimeStampTypes(signature);

    const dateSigningTime = new Date(signature.signingTime);
    dateSigningTime.setHours(dateSigningTime.getHours());

    return (
      <div className="row halfbottom" onClick={this.handleClick}>
        <div className="col s12 primary-text">Свойства подписи:</div>
        <div className="col s12 ">
          <div className={isHaveTimeStamps ? "col s10" : "col s12"}>
            <div className="collection-info">{localize("Sign.standard", locale)}: {signature.ocsp && signature.ocsp.OCSP ? SignatureStandard.CADES : SignatureStandard.CMS}</div>

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
              <TimestampTypeSelector timeStampTypes={timeStampTypes} changeType={this.handleChangeTimeStampType} />
              <TimestampInfo timestamp={this.getTimeStamp()} />
            </div>
            :
            <div className="row">
              <div className="col s12 primary-text">Сертификат подписчика:</div>
              <div className="col s12">
                <div className="collection">
                  <div className="collection-item certs-collection certificate-info">
                    <NameInfo name={signerCert.subjectName} />
                    <div className="collection-info">{localize("Certificate.subject", locale)}</div>
                  </div>

                  <div className="collection-item certs-collection certificate-info">
                    {
                      this.isMinsvyazRoot() ?
                        <React.Fragment>
                          <div className="collection-title">{signerCert.issuerFriendlyName}</div>
                          <div className="collection-title selectable-text valid">выдан аккредитованным УЦ</div>
                          <div className="collection-info">{localize("Certificate.issuer", locale)}</div>
                        </React.Fragment>
                        :
                        <React.Fragment>
                          <div className="collection-title">{signerCert.issuerFriendlyName}</div>
                          <div className="collection-info">{localize("Certificate.issuer", locale)}</div>
                        </React.Fragment>
                    }

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

  getTimeStamp = () => {
    const { currentStampType } = this.state;
    const { signature } = this.props;

    if (signature) {
      for (const timestamp of signature.timestamps) {
        if (timestamp.Type === currentStampType) {
          return timestamp;
        }
      }
    }
  }

  handleChangeTimeStampType = (currentStampType: string) => {
    this.setState({ currentStampType });
  }

  toggleShowTimestamp = () => {
    this.setState({ isShowTimeStamps: !this.state.isShowTimeStamps });
  }

  isHaveTimeStamps = (signature: any) => {
    return signature && signature.timestamps && signature.timestamps.length;
  }

  getTimeStampTypes = (signature: any) => {
    const types: string[] = [];

    if (signature) {
      for (const timestamp of signature.timestamps) {
        if (!types.includes(timestamp.Type)) {
          types.push(timestamp.Type);
        }
      }
    }

    return types;
  }
  isMinsvyazRoot = () => {
    const { chain } = this.state;

    if (chain && chain.length) {
      const rootCertInChain = chain.items(chain.length - 1);

      if (rootCertInChain && rootCertInChain.thumbprint.toLowerCase() === "4BC6DC14D97010C41A26E058AD851F81C842415A".toLowerCase()) {
        return true;
      } else {
        return false;
      }
    } else {
      return false;
    }
  }

  buildChain = (certItem: any) => {
    let certificate = certItem.object ? certItem.object : null;
    if (certificate === null) {
      if (certItem.x509) {
        try {
          certificate = trusted.pki.Certificate.import(Buffer.from(certItem.x509), trusted.DataFormat.PEM);
        } catch (e) {
          return null;
        }
      } else {
        certificate = window.PKISTORE.getPkiObject(certItem);
      }
    }

    try {
      return trusted.utils.Csp.buildChain(certificate);
    } catch (e) {
      return null;
    }
  }

}

export default SignatureStatus;
