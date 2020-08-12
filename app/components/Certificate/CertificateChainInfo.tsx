import PropTypes from "prop-types";
import React from "react";
import { CRYPTOPRO_DSS } from "../../constants";

class CertificateChainInfo extends React.Component<any, any> {
  static contextTypes = {
    locale: PropTypes.string,
    localize: PropTypes.func,
  };

  constructor(props: any) {
    super(props);
    this.state = ({
      chain: [],
      isChainVerified: false,
      openItemId: props.activeItem ? props.activeItem : null,
    });
  }

  componentDidMount() {
    const { certificate } = this.props;
    const { activeItem } = this.props;

    const provider = certificate.provider;
    const chain = this.buildChain(certificate);
    const verifiedChain = [];

    if (chain && chain.length) {
      for (let j = 0; j < chain.length; j++) {
        const item = chain.items(j);
        const status = this.verifyCertificateChain(chain.items(j), provider);

        verifiedChain.push({ certificate: item, status });
      }
    }

    this.setState({
      chain: verifiedChain,
      isChainVerified: true,
      openItemId: activeItem ? activeItem : null,
    });
  }

  render() {
    return (
      <div className={"collection"}>
        {this.getElements()}
      </ div>
    );
  }

  toggleOpenItem = (openItemId: any) => (ev: any) => {
    if (ev && ev.preventDefault) {
      ev.preventDefault();
    }

    this.setState({ openItemId });
  }

  isItemOpened = (id: number) => {
    return id === this.state.openItemId;
  }

  getElements() {
    const { certificate, onClick } = this.props;
    const { chain, isChainVerified } = this.state;

    const elements = [];
    let curKeyStyle = "";
    let curStatusStyle = "";

    if (isChainVerified && chain && chain.length) {
      for (let j: number = chain.length - 1; j >= 0; j--) {
        const element = chain[j].certificate;
        const status = chain[j].status;
        let circleStyle = "material-icons left chain_1";
        const vertlineStyle = {
          visibility: "hidden",
        };

        if (j < 10) {
          circleStyle = "material-icons left chain_" + (j + 1);
        } else {
          circleStyle = "material-icons left chain_10";
        }

        if (j > 0) {
          vertlineStyle.visibility = "visible";
        }

        if (status) {
          curStatusStyle = "cert_status_ok";
        } else {
          curStatusStyle = "cert_status_error";
        }

        if (j === 0) {
          curKeyStyle = certificate.key.length > 0 ? "key " : "";

          if (curKeyStyle) {
            if (certificate.dssUserID) {
              curKeyStyle += "dsskey";
            } else {
              curKeyStyle += "localkey";
            }
          }
        }

        const active = this.isItemOpened(element.thumbprint) ? "active" : "";

        elements.push(
          <div className={"collection-item avatar certs-collection " + active} key={element.serialNumber + "_" + element.thumbprint}>
            <div className="row chain-item " onClick={this.toggleOpenItem(element.thumbprint)}>
              <div className="col s1">
                <i className={circleStyle}></i>
                <div className={"vert_line"} style={vertlineStyle}></div>
              </div>
              <div className="col s10" onClick={() => onClick(element)}>
                <div className="r-iconbox-link">
                  <div className="collection-title chain_textblock">{element.subjectFriendlyName}</div>
                  <div className="collection-info ">{element.issuerFriendlyName}</div>
                </div>
              </div>
              <div className="col s1">
                <div className="row nobottom">
                  <div className={curStatusStyle + " "} style={{ marginLeft: "-15px" }} />
                </div>
              </div>
            </div>
          </div>);
      }
    }

    return elements;
  }

  buildChain = (certItem: any) => {
    let certificate = certItem.object ? certItem.object : null;
    if (certificate === null) {
      if (certItem.x509 && certItem.dssUserID) {
        try {
          certificate = trusted.pki.Certificate.import(Buffer.from(certItem.x509), trusted.DataFormat.PEM);
        } catch (e) {
          return null;
        }
      } else {
        certificate = window.PKISTORE.getPkiObject(certItem);
      }
    }

    try {
      return trusted.utils.Csp.buildChain(certificate);
    } catch (e) {
      return null;
    }
  }

  verifyCertificateChain = (cert: trusted.pki.Certificate, provider: string) => {
    try {
      return trusted.utils.Csp.verifyCertificateChain(cert);
    } catch (e) {
      return null;
    }
  }
}

export default CertificateChainInfo;
