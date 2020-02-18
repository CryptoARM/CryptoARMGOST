import PropTypes from "prop-types";
import React from "react";
import { connect } from "react-redux";
import { verifyCertificate } from "../../AC";
import { CRYPTOPRO_DSS } from "../../constants";

const rectangleValidStyle = {
  background: "#4caf50",
};

const rectangleUnvalidStyle = {
  background: "#1D587f",
};

interface ICertificateListItemProps {
  chooseCert: () => void;
  operation: string;
  isOpen: boolean;
  toggleOpen: () => void;
  cert: any;
  verifyCertificate: (id: any) => void;
}

class CertificateListItemBigWidth extends React.Component<ICertificateListItemProps, {}> {
  static contextTypes = {
    locale: PropTypes.string,
    localize: PropTypes.func,
  };

  timerHandle: NodeJS.Timer | null;

  shouldComponentUpdate(nextProps: ICertificateListItemProps) {
    return nextProps.isOpen !== this.props.isOpen ||
      nextProps.cert.verified !== this.props.cert.verified;
  }

  componentDidMount() {
    // tslint:disable-next-line:no-shadowed-variable
    const { cert, verifyCertificate } = this.props;

    this.timerHandle = setTimeout(() => {
      if (!cert.verified) {
        verifyCertificate(cert.id);
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
    const { locale, localize } = this.context;
    const { cert, operation, isOpen } = this.props;

    let active = "";
    let curStatusStyle;
    let curKeyStyle;
    let rectangleStyle;

    const status = cert.status;

    if (status) {
      curStatusStyle = cert.dssUserID ? "cloud_cert_status_ok" : "cert_status_ok";
      rectangleStyle = rectangleValidStyle;
    } else {
      curStatusStyle = cert.dssUserID  ? "cloud_cert_status_error" : "cert_status_error";
      rectangleStyle = rectangleUnvalidStyle;
    }

    curKeyStyle = cert.key.length > 0 ? curKeyStyle = "key " : curKeyStyle = "";

    if (curKeyStyle) {
      if (cert.dssUserID) {
        curKeyStyle += "dsskey";
      } else {
        curKeyStyle += "localkey";
      }
    }

    if (isOpen) {
      active = "active";
    }

    return (
      <div className="row certificate-list-item" id={cert.id}>
        <div className={"collection-item avatar certs-collection " + active}
          onClick={this.handleClick}>
          <div className="row nobottom valign-wrapper">
            <div className="col s1">
              <div className={curStatusStyle} />
            </div>
            <div className="col s4">
              <div className="collection-title">{cert.subjectFriendlyName}</div>
            </div>
            <div className="col s3">
              <div className="collection-info ">{cert.issuerFriendlyName}</div>
            </div>
            <div className="col s3">
              <div className="collection-info ">{new Date(cert.notAfter).toLocaleDateString(locale, {
                day: "numeric",
                hour: "numeric",
                minute: "numeric",
                month: "numeric",
                year: "numeric",
              })
              }</div>
            </div>
            <div className="col s1">
              <div className={curKeyStyle} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  handleClick = () => {
    const { chooseCert, toggleOpen } = this.props;

    chooseCert();
    toggleOpen();
  }
}

export default connect(null, { verifyCertificate })(CertificateListItemBigWidth);
