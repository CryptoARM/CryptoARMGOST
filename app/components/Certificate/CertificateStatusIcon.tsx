import React from "react";
import { connect } from "react-redux";
import { verifyCertificate } from "../../AC";

interface ICertificateStatusIconProps {
  certificate: any;
}

class CertificateStatusIcon extends React.Component<ICertificateStatusIconProps, {}> {
  timerHandle: NodeJS.Timer | null;

  componentDidMount() {
    const { certificate, verifyCertificate } = this.props;

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
    const { certificate } = this.props;

    let curStatusStyle;

    if (certificate && certificate.status) {
      curStatusStyle = certificate.dssUserID ? "cloud_cert_status_ok" : "cert_status_ok";
    } else {
      curStatusStyle = certificate.dssUserID  ? "cloud_cert_status_error" : "cert_status_error";
    }

    return (
      <div className={curStatusStyle} />
    );
  }
}

export default connect((state, ownProps: any) => {
  return {
    certificate: ownProps.certificate ? state.certificates.getIn(["entities", ownProps.certificate.id]) : undefined,
  };
}, { verifyCertificate })(CertificateStatusIcon);
