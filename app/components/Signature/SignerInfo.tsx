import { resolve } from "dns";
import React from "react";
import { connect } from "react-redux";
import { verifyCertificate } from "../../AC";

interface ISignerInfoProps {
  signer: any;
  style?: any;
  verifyCertificate: (id: any) => void;
}

class SignerInfo extends React.Component<ISignerInfoProps, any> {
  timerHandle: NodeJS.Timer | null;
  componentDidMount() {
    const { verifyCertificate, signer } = this.props;

    this.timerHandle = setTimeout(() => {
      if (!signer.verified) {
        verifyCertificate(signer.id);
      }

      this.timerHandle = null;
    }, 2000);
  }

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
     let certificate = signer.object ? signer.object : null;
     if (certificate === null) {
      if (signer.x509) {
        try {
          certificate = trusted.pki.Certificate.import(Buffer.from(signer.x509), trusted.DataFormat.PEM);
        } catch (e) {
          return null;
        }
      } else {
        certificate = window.PKISTORE.getPkiObject(signer);
      }
    }
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
