import PropTypes from "prop-types";
import React from "react";

const rectangleValidStyle = {
  background: "#4caf50",
};

const rectangleUnvalidStyle = {
  background: "#bf3817",
};

interface ICertificateListItemProps {
  chooseCert: () => void;
  operation: string;
  isOpen: boolean;
  toggleOpen: () => void;
  crl: any;
}

class CRLListItem extends React.Component<ICertificateListItemProps, {}> {
  static contextTypes = {
    locale: PropTypes.string,
    localize: PropTypes.func,
  };

  shouldComponentUpdate(nextProps: ICertificateListItemProps) {
    return nextProps.isOpen !== this.props.isOpen;
  }

  handleClick = () => {
    const { chooseCert, toggleOpen } = this.props;

    chooseCert();
    toggleOpen();
  }

  render() {
    const { crl, isOpen } = this.props;
    let active = "";
    let rectangleStyle;

    const status = this.checkCRL(crl);

    if (status) {
      rectangleStyle = rectangleValidStyle;
    } else {
      rectangleStyle = rectangleUnvalidStyle;
    }

    if (isOpen) {
      active = "active";
    }

    return (
      <div className="row certificate-list-item" id={crl.id}>
        <div className={"collection-item avatar certs-collection " + active} onClick={this.handleClick}>
          <div className="rectangle" style={rectangleStyle} />
          <div className="col s11">
            <div className="collection-title ">{crl.issuerFriendlyName}</div>
            <div className="collection-info ">{crl.issuerFriendlyName}</div>
          </div>
        </div>
      </div>
    );
  }

  checkCRL = (crl: any) => {
    const currentDate = new Date();

    if (((new Date(crl.nextUpdate)).getTime() >= currentDate.getTime()) &&
      ((new Date(crl.lastUpdate)).getTime() <= currentDate.getTime())) {
      return true;
    } else {
      //
    }

    return false;
  }
}

export default CRLListItem;
