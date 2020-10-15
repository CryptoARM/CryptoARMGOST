import PropTypes from "prop-types";
import React from "react";
import { Link } from "react-router-dom";
import { LOCATION_CERTIFICATES, LOCATION_CONTAINERS, MY } from "../../constants";
import {
  ERROR_CHECK_CSP_LICENSE, ERROR_CHECK_CSP_PARAMS,
  ERROR_LOAD_TRUSTED_CRYPTO, ERROR_LOAD_TRUSTED_CURL, NO_CORRECT_CRYPTOARM_LICENSE,
  NO_CRYPTOARM_LICENSE,
  NO_GOST_2001, NO_GOST_2012, NO_HAVE_CERTIFICATES_WITH_KEY, NO_TSP_OCSP_ENABLED, NOT_INSTALLED_CSP,
} from "../../errors";
import HeaderWorkspaceBlock from "../HeaderWorkspaceBlock";

interface IResolveProps {
  activeError: string;
  onClose?: () => void;
}

class Resolve extends React.Component<IResolveProps, {}> {
  static contextTypes = {
    locale: PropTypes.string,
    localize: PropTypes.func,
  };

  handleCloseModal = () => {
    const { onClose } = this.props;

    if (onClose) {
      onClose();
    }

    $("#modal-window-diagnostic").closeModal();
  }

  gotoLink = (address: string) => {
    window.electron.shell.openExternal(address);
  }

  getResolveByType = (error: string) => {
    const { localize, locale } = this.context;

    switch (error) {
      case ERROR_LOAD_TRUSTED_CRYPTO:
        return (
          <div className="resolve-content">
            <p className="help_paragraf">
              {localize("Problems.resolve_6_1", locale)}
            </p>
            <p className="help_paragraf">
              {localize("Problems.resolve_6_2", locale)}
            </p>
            <p className="help_paragraf">{localize("Problems.resolve_6_3", locale)}
              <a className="hlink" onClick={(event) => this.gotoLink(localize("Help.link_user_guide", locale))}>
                {localize("Help.link_user_guide_name", locale)}
              </a>
            </p>
          </div>
        );

      case ERROR_LOAD_TRUSTED_CURL:
        return (
          <div className="resolve-content">
            <p className="help_paragraf">
              {localize("Problems.resolve_7_1", locale)}
            </p>
            <p className="help_paragraf">
              {localize("Problems.resolve_7_2", locale)}
            </p>
            <p className="help_paragraf">{localize("Problems.resolve_7_3", locale)}
              <a className="hlink" onClick={(event) => this.gotoLink(localize("Help.link_user_guide", locale))}>
                {localize("Help.link_user_guide_name", locale)}
              </a>
            </p>
          </div>
        );

      case NOT_INSTALLED_CSP:
        return (
          <div className="resolve-content">
            <p className="help_paragraf">{localize("Problems.resolve_1_1", locale)}</p>
            <p className="help_paragraf">{localize("Problems.resolve_1_2", locale)}</p>
            <p className="help_paragraf">{localize("Problems.resolve_1_3", locale)}
              <a className="hlink" onClick={(event) => this.gotoLink("https://diagnostic.cryptoarm.ru/")}> https://diagnostic.cryptoarm.ru/</a>
            </p>
            <p className="help_paragraf">{localize("Problems.resolve_1_4", locale)}
              <a className="hlink" onClick={(event) => this.gotoLink("https://cryptoarm.ru/upload/docs/userguide-cryptoarm-gost.pdf")}>
                {localize("Help.link_user_guide_name", locale)}
              </a>
            </p>
          </div>
        );

      case NO_TSP_OCSP_ENABLED:
        return (
          <div className="resolve-content">
            <p className="help_paragraf">{localize("Problems.resolve_8_1", locale)}</p>
            <p className="help_paragraf">{localize("Problems.resolve_8_2", locale)}</p>
            <p className="help_paragraf">{localize("Problems.resolve_8_3", locale)}
              <a className="hlink" onClick={(event) => this.gotoLink("https://www.cryptopro.ru/")}> www.cryptopro.ru</a>
            </p>
          </div>
        );

      case ERROR_CHECK_CSP_LICENSE:
        return (
          <div className="resolve-content">
            <p className="help_paragraf">{localize("Problems.resolve_2_1", locale)}</p>
            <p className="help_paragraf">
              {localize("Problems.resolve_2_2", locale)}
              <a className="hlink" onClick={(event) => this.gotoLink("https://cryptoarm.ru/shop/skzi-cryptopro-csp-5-0")}> cryptoarm.ru</a>
            </p>
            <p className="help_paragraf">{localize("Problems.resolve_2_3", locale)} </p>
          </div>
        );
      case NO_GOST_2001:
      case NO_GOST_2012:
        return (
          <div className="resolve-content">
            <p className="help_paragraf">{localize("Problems.resolve_1_1", locale)}</p>
            <p className="help_paragraf">{localize("Problems.resolve_1_2", locale)}</p>
            <p className="help_paragraf">{localize("Problems.resolve_1_3", locale)}
              <a className="hlink" onClick={(event) => this.gotoLink("https://diagnostic.cryptoarm.ru/")}> https://diagnostic.cryptoarm.ru/</a>
            </p>
            <p className="help_paragraf">
              {localize("Problems.resolve_1_4", locale)}
              <a className="hlink" onClick={(event) => this.gotoLink("https://cryptoarm.ru/upload/docs/userguide-cryptoarm-gost.pdf")}>
                {localize("Help.link_user_guide_name", locale)}
              </a>
            </p>
          </div>
        );
      case ERROR_CHECK_CSP_PARAMS:
        return (
          <div className="resolve-content">
            <p className="help_paragraf">{localize("Problems.resolve_4_1", locale)}</p>
            <p className="help_paragraf">{localize("Problems.resolve_4_2", locale)}</p>
            <p className="help_paragraf">{localize("Problems.resolve_4_3", locale)}
              <a className="hlink" onClick={(event) => this.gotoLink("https://cryptoarm.ru/upload/docs/userguide-cryptoarm-gost.pdf")}>
                {localize("Help.link_user_guide_name", locale)}
              </a>
            </p>
          </div>
        );
      case NO_CRYPTOARM_LICENSE:
        return (
          <div className="resolve-content">
            <p className="help_paragraf">{localize("Problems.resolve_3_1", locale)}</p>
            <p className="help_paragraf">{localize("Problems.resolve_3_2", locale)}</p>
            <p className="help_paragraf">{localize("Problems.resolve_3_3", locale)}
              <a className="hlink" onClick={(event) => this.gotoLink("https://cryptoarm.ru/")}> cryptoarm.ru</a>
            </p>
            <p className="help_paragraf">{localize("Problems.resolve_3_4", locale)}</p>
          </div>
        );
      case NO_CORRECT_CRYPTOARM_LICENSE:
        return (
          <div className="resolve-content">
            <p className="help_paragraf">{localize("Problems.resolve_3_1", locale)}</p>
            <p className="help_paragraf">{localize("Problems.resolve_3_2", locale)}</p>
            <p className="help_paragraf">{localize("Problems.resolve_3_3", locale)}
              <a className="hlink" onClick={(event) => this.gotoLink("https://cryptoarm.ru/")}> cryptoarm.ru</a>
            </p>
            <p className="help_paragraf">{localize("Problems.resolve_3_4", locale)}</p>
          </div>
        );

      case NO_HAVE_CERTIFICATES_WITH_KEY:
        return (
          <div className="resolve-content">
            <p className="help_paragraf">{localize("Problems.resolve_5_1", locale)}</p>
            <p className="help_paragraf">{localize("Problems.resolve_5_2", locale)}
              <a className="hlink" onClick={(event) => this.gotoLink("https://cryptoarm.ru/upload/docs/userguide-cryptoarm-gost.pdf")}>
                {localize("Help.link_user_guide_name", locale)}
              </a>
            </p>
            <p className="help_paragraf">
              {localize("Problems.resolve_5_3", locale)}
              <Link to={LOCATION_CONTAINERS} onClick={() => this.handleCloseModal()}>
                {localize("Containers.Containers", locale)}
              </Link>
            </p>
            <p className="help_paragraf">
              {Number(this.getCPCSPVersion().charAt(0)) < 5 ? localize("Problems.resolve_5_4_1", locale) : localize("Problems.resolve_5_4", locale)}
              <Link
                to={{ pathname: LOCATION_CERTIFICATES, search: "my", state: { head: localize("Certificate.certs_my", locale), store: MY } }}
                onClick={() => this.handleCloseModal()}>
                {localize("Certificate.Certificate", locale)}
              </Link>
            </p>
          </div>
        );

      default:
        return (
          <div className="resolve-content">
            <p className="help_paragraf">{localize("Problems.resolve_1_1", locale)}
              <a className="hlink" onClick={(event) => this.gotoLink("https://cryptoarm.ru/")}> cryptoarm.ru</a>
            </p>
          </div>
        );
    }
  }

  getResolve() {
    const { activeError } = this.props;
    const { localize, locale } = this.context;

    return (
      <div className="content-wrapper z-depth-1">
        <HeaderWorkspaceBlock text={localize("Diagnostic.resolve_header", locale)} />
        <div className="row">
          <span className="card-infos sub">
            {this.getResolveByType(activeError)}
          </span>
        </div>
      </div>
    );
  }

  render() {
    return (
      <div className="problem-contaner">
        {this.getResolve()}
      </div>
    );
  }

  getCPCSPVersion = () => {
    try {
      return trusted.utils.Csp.getCPCSPVersion();
    } catch (e) {
      return "";
    }
  }
}

export default Resolve;
