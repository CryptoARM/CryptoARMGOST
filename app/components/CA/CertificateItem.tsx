import React from "react";
import { connect } from "react-redux";
import { verifyCertificate } from "../../AC";

interface ICertificateInfoProps {
  certificate: any;
  style?: any;
  verifyCertificate: (id: any) => void;
}

class CertificateInfo extends React.Component<ICertificateInfoProps, any> {
  render() {
    // tslint:disable-next-line:no-shadowed-variable
    const { certificate, verifyCertificate } = this.props;

    if (!certificate) {
      return null;
    }

    const status = certificate.status;
    let curStatusStyle;

    if (status) {
      curStatusStyle = certificate.dssUserID ? "cloud_cert_status_ok" : "cert_status_ok";
    } else {
      curStatusStyle = certificate.dssUserID  ? "cloud_cert_status_error" : "cert_status_error";
    }

    if (certificate && !certificate.verified) {
      verifyCertificate(certificate.id);
    }

    return (
      <React.Fragment>
        <div className="col s12 valign-wrapper" style={{...this.props.style}}>
          <div className="col s2" style={{ padding: 0 }}>
            <div className={curStatusStyle} />
          </div>
          <div className="col s10" style={{ padding: 0 }}>
            <div className="collection-title">{certificate.subjectFriendlyName}</div>
            <div className="collection-info">{certificate.issuerFriendlyName}</div>
          </div>
        </div>
      </React.Fragment>
    );
  }
}

export default connect((state) => {
  return {};
}, { verifyCertificate })(CertificateInfo);
