import PropTypes from "prop-types";
import React from "react";
import { localizeAlgorithm } from "../../i18n/localize";
import { IOcsp } from "../../reducer/signatures";

interface IOcspInfoProps {
  ocsp: IOcsp;
}

class OcspInfo extends React.Component<IOcspInfoProps, {}> {
  static contextTypes = {
    locale: PropTypes.string,
    localize: PropTypes.func,
  };

  constructor(props: IOcspInfoProps) {
    super(props);
  }

  render() {
    const { ocsp } = this.props;
    const { localize, locale } = this.context;

    if (!ocsp || !ocsp.OCSP) {
      return null;
    }

    const status = this.verify();
    const ocspCertStatus = this.verifyCertificate(ocsp.OcspCert);
    const signerCertStatus = ocsp.Status === 0;

    let curStatusStyle;
    let isValid = "";
    let icon = "";
    let statusOcsp = "";

    let signerIsValid = "";
    let signerIcon = "";
    let signerStatus = "";

    if (ocspCertStatus) {
      curStatusStyle = "cert_status_ok";
    } else {
      curStatusStyle = "cert_status_error";
    }

    if (signerCertStatus) {
      signerStatus = localize("Ocsp.signer_cert_ok", locale);
      signerIcon = "status_ok_icon";
      signerIsValid = "valid";
    } else {
      signerStatus = localize("Ocsp.signer_cert_fail", locale);
      signerIcon = "status_error_icon";
      signerIsValid = "unvalid";
    }

    if (status) {
      statusOcsp = localize("Ocsp.ocsp_sign_ok", locale);
      icon = "status_ok_icon";
      isValid = "valid";
    } else {
      statusOcsp = localize("Ocsp.ocsp_sign_fail", locale);
      icon = "status_error_icon";
      isValid = "unvalid";
    }

    return (
      <div className="row halfbottom" >
        <div className="row">
          <div className="col s2" style={{ width: "11%" }}>
            <div className={icon} />
          </div>
          <div className="col s10">
            <div className="col s12">
              <div className={isValid}>{statusOcsp}</div>

              <div className="collection-info">{localize("Tsp.checked", locale)}: {true ? (new Date()).toLocaleString(locale, {
                day: "numeric",
                hour: "numeric",
                minute: "numeric",
                month: "long",
                year: "numeric",
              }) : "-"}</div>
            </div>
          </div>
        </div>

        <div className="row">
          <div className="col s2" style={{ width: "11%" }}>
            <div className={signerIcon} />
          </div>
          <div className="col s10">
            <div className="col s12">
              <div className={signerIsValid}>{signerStatus}</div>

              <div className="collection-info">{localize("Tsp.checked", locale)}: {ocsp.ThisUpdate ? ocsp.ThisUpdate : "-"}</div>
            </div>
          </div>
        </div>

        <div className="col s12 primary-text">{localize("Ocsp.ocsp_properties", locale)}:</div>
        <div className="col s12">
          <div className="collection">
            <div className="collection-item certs-collection certificate-info">
              <div className="collection-title selectable-text">{ocsp.ProducedAt}</div>
              <div className="collection-info">{localize("Ocsp.produced_at", locale)}</div>
            </div>

            <div className="collection-item certs-collection certificate-info">
              <div className="collection-title selectable-text">{localizeAlgorithm(ocsp.SignatureAlgorithmOid, locale)}</div>
              <div className="collection-info">{localize("Ocsp.signature_algorithm_oid", locale)}</div>
            </div>
          </div>
        </div>

        <div className="col s12 primary-text">{localize("Ocsp.ocsp_certificate", locale)}:</div>
        <div className="col s12 valign-wrapper">
          <div className="col s2">
            <div className={curStatusStyle} />
          </div>
          <div className="col s10">
            <div className="collection-title selectable-text">{ocsp.OcspCert.subjectFriendlyName}</div>
            <div className="collection-info">{ocsp.OcspCert.issuerFriendlyName}</div>
          </div>
        </div>

        <div className="col s12">
          <div className="collection">
            <div className="collection-item certs-collection certificate-info">
              <div className="collection-title selectable-text">{ocsp.OcspCert.serialNumber}</div>
              <div className="collection-info">{localize("Certificate.serialNumber", locale)}</div>
            </div>

            <div className="collection-item certs-collection certificate-info">
              <div className="collection-title">{(new Date(ocsp.OcspCert.notAfter)).toLocaleDateString(locale, {
                day: "numeric",
                hour: "numeric",
                minute: "numeric",
                month: "long",
                year: "numeric",
              })}</div>
              <div className="collection-info">{localize("Certificate.cert_valid", locale)}</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  verify = () => {
    const { localize, locale } = this.context;
    const { ocsp } = this.props;

    try {
      const res = ocsp.OCSP.Verify();

      if (res === 0) {
        return true;
      } else {
        $(".toast-error_verify_tsp").remove();
        Materialize.toast(`${localize("Tsp.error_verify_tsp", locale)}: ${res}`, 3000, "toast-error_verify_tsp");

        return false;
      }
    } catch (e) {
      $(".toast-error_verify_tsp").remove();
      Materialize.toast(`${localize("Tsp.error_verify_tsp", locale)} ${e}`, 3000, "toast-error_verify_tsp");
    }

    return false;
  }

  verifyCertificate = (certificate: trusted.pki.Certificate) => {
    const { localize, locale } = this.context;
    const { ocsp } = this.props;

    try {
      const res = ocsp.OCSP.VerifyCertificate(certificate);

      if (res === 0) {
        return true;
      } else {
        $(".toast-error_verify_certificate").remove();
        Materialize.toast(`${localize("Tsp.error_verify_certificate", locale)}: ${res}`, 3000, "toast-error_verify_certificate");

        return false;
      }
    } catch (e) {
      $(".toast-error_verify_certificate").remove();
      Materialize.toast(`${localize("Tsp.error_verify_certificate", locale)} ${e}`, 3000, "toast-error_verify_certificate");
    }

    return false;
  }
}

export default OcspInfo;
