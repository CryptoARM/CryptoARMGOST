import React from "react";
import { connect } from "react-redux";
import { verifyCertificate } from "../../AC";

interface ISignerInfoProps {
  signer: any;
  style?: any;
  verifyCertificate: (id: any) => void;
}

class SignerInfo extends React.Component<ISignerInfoProps, any> {
  render() {
    // tslint:disable-next-line:no-shadowed-variable
    const { signer, verifyCertificate } = this.props;

    if (!signer) {
      return null;
    }

    const status = signer.status;
    let curStatusStyle;

    if (status) {
      curStatusStyle = signer.dssUserID ? "cloud_cert_status_ok" : "cert_status_ok";
    } else {
      curStatusStyle = signer.dssUserID  ? "cloud_cert_status_error" : "cert_status_error";
    }

    if (signer && !signer.verified) {
      verifyCertificate(signer.id);
    }

    return (
      <React.Fragment>
        <div className="col s12 valign-wrapper" style={{...this.props.style}}>
          <div className="col s2">
            <div className={curStatusStyle} />
          </div>
          <div className="col s10">
            <div className="collection-title">{signer.subjectFriendlyName}</div>
            <div className="collection-info">{signer.issuerFriendlyName}</div>
          </div>
        </div>
      </React.Fragment>
    );
  }
}

export default connect((state) => {
  return {};
}, { verifyCertificate })(SignerInfo);
