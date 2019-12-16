import PropTypes from "prop-types";
import React from "react";
import { REQUEST_STATUS } from "../../constants";
import { arrayToMap } from "../../utils";
import { IService } from "../Services/types";

interface IRequestCAListItemProps {
  chooseCert: () => void;
  operation: string;
  isOpen: boolean;
  toggleOpen: () => void;
  requestCA: any;
  service: IService;
}

class RequestCAListItem extends React.Component<IRequestCAListItemProps, {}> {
  static contextTypes = {
    locale: PropTypes.string,
    localize: PropTypes.func,
  };

  shouldComponentUpdate(nextProps: IRequestCAListItemProps) {
    return (nextProps.isOpen !== this.props.isOpen) || (nextProps.requestCA.status !== this.props.requestCA.status);
  }

  handleClick = () => {
    const { chooseCert, toggleOpen } = this.props;

    chooseCert();
    toggleOpen();
  }

  render() {
    const { requestCA, isOpen, service } = this.props;
    let active = "";

    if (isOpen) {
      active = "active";
    }

    const subjectObj = requestCA && requestCA.subject ?
      requestCA.subject.reduce((obj, item) => (obj[item.type] = item.value, obj), {}) :
      {};

    let status = "ca_request_status ";

    switch (requestCA.status) {
      case REQUEST_STATUS.Q:
      case REQUEST_STATUS.A:
      case REQUEST_STATUS.P:
        status = status + "wait";
        break;
      case REQUEST_STATUS.D:
      case REQUEST_STATUS.R:
      case REQUEST_STATUS.E:
        status = status + "error";
        break;
      case REQUEST_STATUS.C:
      case REQUEST_STATUS.K:
        status = status + "ok";
        break;
      default:
        status = status + "unknown";
    }

    return (
      <div className="row certificate-list-item" id={requestCA.id}>
        <div className={"collection-item avatar certs-collection " + active} onClick={this.handleClick}>
          <div className="row nobottom valign-wrapper">
            <div className="col s1">
              <div className="ca_request" />
            </div>
            <div className="col s10">
              <div className="collection-title ">{subjectObj && subjectObj["2.5.4.3"] ? subjectObj["2.5.4.3"] : "-"}</div>
              <div className="collection-info ">{service ? service.name : "-"}</div>
            </div>
            <div className="col s1">
              <div className={status} />
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default RequestCAListItem;
