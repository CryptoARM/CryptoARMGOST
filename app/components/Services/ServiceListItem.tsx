import PropTypes from "prop-types";
import React from "react";
import { REQUEST_STATUS } from "../../constants";

interface IServiceListItemProps {
  chooseCert: () => void;
  isOpen: boolean;
  toggleOpen: () => void;
  regRequest: any;
  service: any;
}

class ServiceListItem extends React.Component<IServiceListItemProps, {}> {
  static contextTypes = {
    locale: PropTypes.string,
    localize: PropTypes.func,
  };

  render() {
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
            <div className="col s11">
              <div className="collection-title">{service.name}</div>
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
export default (ServiceListItem);
