import PropTypes from "prop-types";
import React from "react";

interface ICertificateInfoTabsProps {
  activeCertInfoTab: (active: boolean) => void;
}

class CertificateInfoTabs extends React.Component<ICertificateInfoTabsProps, any> {
  static contextTypes = {
    locale: PropTypes.string,
    localize: PropTypes.func,
  };

  componentDidMount() {
    $(document).ready(function () {
      $("ul.tabs").tabs();
    });

    $(document).ready(function () {
      $("ul.tabs").tabs("select_tab", "tab_id");
    });
  }

  render() {
    const { localize, locale } = this.context;
    const { activeCertInfoTab } = this.props;

    return (
      <div className="row">
        <ul id="tabs-swipe-demo" className="tabs" style={{ background: "none" }}>
          <li className="tab col s6">
            <a className="secondary-text active" onClick={() => activeCertInfoTab(true)} style={{ fontSize: "0.75rem" }}>
              {localize("Certificate.cert_info", locale)}
            </a>
          </li>
          <li className="tab col s6">
            <a className="secondary-text" onClick={() => activeCertInfoTab(false)} style={{ fontSize: "0.75rem" }}>
              {localize("Certificate.cert_chain", locale)}
            </a>
          </li>
        </ul>
      </div>
    );
  }
}

export default CertificateInfoTabs;
