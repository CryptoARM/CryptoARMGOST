import React from "react";
import { connect } from "react-redux";
import { verifyCertificate } from "../../AC";

interface ICertificateStatusIconProps {
  certificate: any;
  isCertInfoMode: boolean;
  urlCmdCertInfo: any;
}

class CertificateStatusIcon extends React.Component<ICertificateStatusIconProps, {}> {
  timerHandle: NodeJS.Timer | null;

  componentDidMount() {
    const { certificate, verifyCertificate, isCertInfoMode } = this.props;

    if (isCertInfoMode) {
      return;
    }

    this.timerHandle = setTimeout(() => {
      if (!certificate.verified) {
        verifyCertificate(certificate.id);
      }

      this.timerHandle = null;
    }, 2000);
  }

  componentWillUnmount() {
    if (this.timerHandle) {
      clearTimeout(this.timerHandle);
      this.timerHandle = null;
    }
  }

  render() {
    const { certificate, isCertInfoMode, urlCmdCertInfo } = this.props;

    if (!isCertInfoMode && !certificate) {
      return null;
    }

    const verifiedCert = isCertInfoMode && urlCmdCertInfo.certToProcessPkiItemInfo
      ? urlCmdCertInfo.certToProcessPkiItemInfo : certificate;
    let curStatusStyle;

    if (verifiedCert && verifiedCert.status) {
      curStatusStyle = verifiedCert.dssUserID ? "cloud_cert_status_ok" : "cert_status_ok";
    } else {
      curStatusStyle = verifiedCert.dssUserID ? "cloud_cert_status_error" : "cert_status_error";
    }

    return (
      <div className={curStatusStyle} />
    );
  }
}

export default connect((state, ownProps: any) => {
  return {
    certificate: ownProps.certificate && !ownProps.trustedServices ? state.certificates.getIn(["entities", ownProps.certificate.id]) : ownProps.certificate ? ownProps.certificate : undefined,
    isCertInfoMode: !state.urlCmdCertInfo.done,
    urlCmdCertInfo: state.urlCmdCertInfo,
  };
}, { verifyCertificate })(CertificateStatusIcon);
