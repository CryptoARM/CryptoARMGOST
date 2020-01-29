import PropTypes from "prop-types";
import React from "react";
import Media from "react-media";
import { connect } from "react-redux";
import { AutoSizer, List } from "react-virtualized";
import { loadAllCertificates, verifyCertificate } from "../../AC";
import { REQUEST } from "../../constants";
import accordion from "../../decorators/accordion";
import { filteredCertificatesSelector } from "../../selectors";
import { filteredCrlsSelector } from "../../selectors/crlsSelectors";
import { filteredRequestCASelector } from "../../selectors/requestCASelector";
import { mapToArr } from "../../utils";
import CrlTable from "../CRL/CrlTable";
import ProgressBars from "../ProgressBars";
import CertificateListItem from "./CertificateListItem";
import CertificateListItemBigWidth from "./CertificateListItemBigWidth";
import CertificateTable from "./CertificateTable";

const HEIGHT_MODAL = 356;
const HEIGHT_FULL = 432;
const ROW_HEIGHT = 45;

interface ICertificateListProps {
  activeCert: (certificate: any) => void;
  activeCrl: (crl: any) => void;
  activeRequestCA: (requestCA: any) => void;
  certificates: any;
  crls: any;
  isLoaded: boolean;
  isLoading: boolean;
  operation: string;
  certrequests: any;
  loadAllCertificates: () => void;
  verifyCertificate: (id: number) => void;
}

class CertificateList extends React.Component<ICertificateListProps, any> {
  static contextTypes = {
    locale: PropTypes.string,
    localize: PropTypes.func,
  };

  constructor(props: ICertificateListProps) {
    super(props);

    this.state = ({
      activeSection: "my",
      countSections: 0,
    });
  }

  componentDidMount() {
    // tslint:disable-next-line:no-shadowed-variable
    const { isLoaded, isLoading, loadAllCertificates } = this.props;

    if (!isLoading && !isLoaded) {
      loadAllCertificates();
    }

    $(".collapsible").collapsible();
  }

  render() {
    const { certificates, crls, isLoading, certrequests } = this.props;

    if (isLoading) {
      return <ProgressBars />;
    }

    const TYPE = this.props.location.state ? this.props.location.state.type : "CERTIFICATE";

    if (TYPE === "REQUEST") {
      return this.getRequestCAList(certrequests);
    } else if (TYPE === "CRL") {
      return this.getCrlsList(crls);
    } else {
      return this.getCertificatesList(certificates);
    }
  }

  getCertificatesList = (certificates: object[]) => {
    const { activeCert, operation, toggleOpenItem, isItemOpened } = this.props;

    if (!certificates || certificates.length === 0) {
      return null;
    }

    return (
      <CertificateTable
        isItemOpened={isItemOpened}
        toggleOpenItem={toggleOpenItem}
        activeCert={activeCert}
        selectedCert={this.props.selectedCert}
        operation={this.props.operation}
      />
    );
  }

  getCrlsList = (crls: object[]) => {
    const { activeCrl, operation, toggleOpenItem, isItemOpened } = this.props;

    if (!crls || crls.length === 0) {
      return null;
    }

    return (
      <CrlTable
        isItemOpened={isItemOpened}
        toggleOpenItem={toggleOpenItem}
        activeCrl={activeCrl}
        selectedCrl={this.props.selectedCrl}
        operation={this.props.operation}
      />
    );
  }

  getRequestCAList = (elements: object[]) => {
    const { activeRequestCA, activeCert, operation, toggleOpenItem, isItemOpened } = this.props;

    if (!elements || elements.length === 0) {
      return null;
    }

    return (
      <AutoSizer>
        {({ height, width }) => (
          <List
            height={height}
            overscanRowCount={2}
            rowCount={elements.length + 1}
            rowHeight={ROW_HEIGHT}
            rowRenderer={({ index, key, style }) => {
              if (!elements.length) {
                return null;
              }

              const request = elements[index];

              if (!request) {
                return null;
              }

              if (request.category === REQUEST) {
                return (
                  <ul
                    key={key}
                    style={style}
                  >
                    <Media query="(max-width: 1020px)">
                      {(matches) =>
                        matches ? (
                          <CertificateListItem
                            key={request.id}
                            cert={request}
                            chooseCert={() => activeCert(request)}
                            operation={operation}
                            isOpen={isItemOpened(request.id.toString())}
                            toggleOpen={toggleOpenItem(request.id.toString())}
                            style={style} />
                        ) : <CertificateListItemBigWidth
                            key={request.id}
                            cert={request}
                            chooseCert={() => activeCert(request)}
                            operation={operation}
                            isOpen={isItemOpened(request.id.toString())}
                            toggleOpen={toggleOpenItem(request.id.toString())}
                            style={style} />
                      }
                    </Media>
                  </ul>
                );
              }
            }}
            width={width}
          />
        )}
      </AutoSizer>
    );
  }
}

interface IOwnProps {
  operation: string;
}

export default connect((state, ownProps: IOwnProps) => {
  return {
    certificates: mapToArr(filteredCertificatesSelector(state, { operation: ownProps.operation })),
    certrequests: filteredRequestCASelector(state).concat(mapToArr(filteredCertificatesSelector(state, { operation: ownProps.operation }))),
    crls: filteredCrlsSelector(state),
    isLoaded: state.certificates.loaded,
    isLoading: state.certificates.loading,
    location: state.router.location,
    services: state.services,
  };
}, { loadAllCertificates, verifyCertificate }, null, { pure: false })(accordion(CertificateList));
