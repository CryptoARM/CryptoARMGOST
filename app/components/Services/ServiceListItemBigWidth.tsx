import PropTypes from "prop-types";
import React from "react";
import { REQUEST_STATUS } from "../../constants";

const rectangleValidStyle = {
  background: "#4caf50",
};

const rectangleUnvalidStyle = {
  background: "#bf3817",
};

interface IServiceListItemProps {
  chooseCert: () => void;
  isOpen: boolean;
  toggleOpen: () => void;
  regRequest: any;
  service: any;
}

class ServiceListItemBigWidth extends React.Component<IServiceListItemProps, {}> {
  static contextTypes = {
    locale: PropTypes.string,
    localize: PropTypes.func,
  };

  timerHandle: NodeJS.Timer | null;

  componentWillUnmount() {
    if (this.timerHandle) {
      clearTimeout(this.timerHandle);
      this.timerHandle = null;
    }
  }

  render() {
    const { locale, localize } = this.context;
    const { service, isOpen, regRequest } = this.props;

    let active = "";
    let status = "ca_service_status ";

    if (regRequest) {
      switch (regRequest.Status) {
        case REQUEST_STATUS.Q:
        case REQUEST_STATUS.P:
          status = status + "unknown";
          break;
        case REQUEST_STATUS.D:
        case REQUEST_STATUS.R:
        case REQUEST_STATUS.E:
          status = status + "error";
          break;
        case REQUEST_STATUS.A:
        case REQUEST_STATUS.C:
        case REQUEST_STATUS.K:
          status = status + "ok";
          break;
        default:
          status = status + "unknown";
      }
    } else {
      status = status + "unknown";
    }

    if (isOpen) {
      active = "active";
    }

    return (
      <div className="row certificate-list-item">
        <div className={"collection-item avatar certs-collection " + active} onClick={this.handleClick}>
          <div className="row nobottom valign-wrapper">
            <div className="col s1">
              <div className={status} />
            </div>
            <div className="col s5">
              <div className="collection-title">{service.name}</div>
            </div>
            <div className="col s6">
              <div className="collection-info ">{service.settings.url}</div>
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
export default (ServiceListItemBigWidth);
