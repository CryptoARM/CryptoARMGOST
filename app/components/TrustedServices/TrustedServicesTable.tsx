import PropTypes from "prop-types";
import React from "react";
import Media from "react-media";
import { connect } from "react-redux";
import { AutoSizer, Column, Table } from "react-virtualized";
import { filteredTrustedServicesSelector } from "../../selectors/trustedServicesSelector";
import "../../table.global.css";
import { mapToArr } from "../../utils";
import CertificateStatusIcon from "../Certificate/CertificateStatusIcon";
import ProgressBars from "../ProgressBars";
import SortDirection from "../Sort/SortDirection";
import SortIndicator from "../Sort/SortIndicator";

type TSortDirection = "ASC" | "DESC" | undefined;

interface ITrustedServicesTableProps {
  eventsMap: any;
  isLoading: boolean;
  searchValue?: string;
}

interface ITrustedServicesTableState {
  disableHeader: boolean;
  hoveredRowIndex: number;
  foundEvents: number[];
  scrollToIndex: number;
  sortBy: string;
  sortDirection: TSortDirection;
  sortedList: any;
}

class TrustedServicesTable extends React.Component<ITrustedServicesTableProps, ITrustedServicesTableState> {
  static contextTypes = {
    locale: PropTypes.string,
    localize: PropTypes.func,
  };

  constructor(props: ITrustedServicesTableProps) {
    super(props);

    const sortBy = "timestamp";
    const sortDirection = SortDirection.DESC;
    const sortedList = this.sortList({ sortBy, sortDirection });

    this.state = {
      disableHeader: false,
      foundEvents: [],
      hoveredRowIndex: -1,
      scrollToIndex: 0,
      sortBy,
      sortDirection,
      sortedList,
    };
  }

  componentDidUpdate(prevProps: ITrustedServicesTableProps) {
    if (!prevProps.eventsMap.size && this.props.eventsMap && this.props.eventsMap.size ||
      (prevProps.eventsMap.size !== this.props.eventsMap.size)) {
      this.sort(this.state);
    }

    if (prevProps.searchValue && !this.props.searchValue) {
      this.setState({ foundEvents: [] });
    }
  }

  render() {
    const { locale, localize } = this.context;
    const { isLoading } = this.props;
    const { disableHeader, scrollToIndex, sortBy, sortDirection, sortedList } = this.state;

    if (isLoading) {
      return <ProgressBars />;
    }

    const rowGetter = ({ index }: { index: number }) => this.getDatum(this.state.sortedList, index);

    return (
      <React.Fragment>
        <div style={{ display: "flex" }}>
          <div style={{ flex: "1 1 auto", height: "calc(100vh - 110px)" }}>

            <Media query="(max-width: 1020px)">
              {(matches) =>
                matches ?
                  <AutoSizer>
                    {({ height, width }) => (
                      <Table
                        ref="Table"
                        disableHeader={disableHeader}
                        height={height}
                        width={width}
                        headerHeight={30}
                        noRowsRenderer={this.noRowsRenderer}
                        headerClassName={"headerColumn"}
                        rowHeight={45}
                        rowClassName={this.rowClassName}
                        onRowClick={this.handleOnRowClick}
                        onRowMouseOver={this.handleOnRowMouseOver}
                        onRowMouseOut={this.handleOnRowMouseOut}
                        overscanRowCount={5}
                        rowGetter={rowGetter}
                        rowCount={sortedList.size}
                        scrollToIndex={scrollToIndex}
                        sort={this.sort}
                        sortBy={sortBy}
                        sortDirection={sortDirection}
                      >
                        <Column
                          cellRenderer={({ cellData, rowData, rowIndex }) => {
                            return (
                              <div className="row nobottom valign-wrapper">
                                <div className="col" style={{ width: "40px", paddingLeft: "0px" }}>
                                  <CertificateStatusIcon certificate={rowData} key={rowData.url} trustedServices={true} />
                                </div>
                                <div className="col s10" style={{ paddingLeft: "0px" }}>
                                  <div className="collection-title truncate">{cellData}</div>
                                </div>
                              </div>);
                          }
                          }
                          dataKey="subjectFriendlyName"
                          headerRenderer={this.headerRenderer}
                          width={width * 0.6}
                          label={localize("Certificate.subject", locale)}
                        />
                        <Column
                          cellRenderer={({ cellData, rowData, rowIndex }) => {
                            return (
                              <div className="row nobottom valign-wrapper" >
                                <div className="col s12" >
                                  <div
                                    className="collection-title truncate"
                                    onClick={() => window.electron.shell.openExternal(cellData)}
                                    style={{ color: "#334294", cursor: "pointer" }}>
                                    {cellData}
                                  </div>
                                </div>
                              </div>);
                          }
                          }
                          dataKey="url"
                          headerRenderer={this.headerRenderer}
                          width={width * 0.6}
                          label={localize("TrustedServices.site", locale)}
                        />
                      </Table>
                    )}
                  </AutoSizer>
                  :
                  <AutoSizer>
                    {({ height, width }) => (
                      <Table
                        ref="Table"
                        disableHeader={disableHeader}
                        height={height}
                        width={width}
                        headerHeight={30}
                        noRowsRenderer={this.noRowsRenderer}
                        headerClassName={"headerColumn"}
                        rowHeight={45}
                        rowClassName={this.rowClassName}
                        onRowClick={this.handleOnRowClick}
                        onRowMouseOver={this.handleOnRowMouseOver}
                        onRowMouseOut={this.handleOnRowMouseOut}
                        overscanRowCount={5}
                        rowGetter={rowGetter}
                        rowCount={sortedList.size}
                        scrollToIndex={scrollToIndex}
                        sort={this.sort}
                        sortBy={sortBy}
                        sortDirection={sortDirection}
                      >
                        <Column
                          cellRenderer={({ cellData, rowData, rowIndex }) => {
                            return (
                              <div className="row nobottom valign-wrapper">
                                <div className="col" style={{ width: "40px", paddingLeft: "0px" }}>
                                  <CertificateStatusIcon certificate={rowData} key={rowData.id} trustedServices={true} />
                                </div>
                                <div className="col s10" style={{ paddingLeft: "5px", marginLeft: "5px" }}>
                                  <div className="collection-title truncate">{cellData}</div>
                                </div>
                              </div>);
                          }
                          }
                          dataKey="subjectFriendlyName"
                          headerRenderer={this.headerRenderer}
                          width={width * 0.4}
                          label={localize("Certificate.subject", locale)}
                        />
                        <Column
                          dataKey="issuerFriendlyName"
                          disableSort={false}
                          headerRenderer={this.headerRenderer}
                          width={width * 0.3}
                          label={localize("Certificate.issuer", locale)}
                        />
                        <Column
                          cellRenderer={({ cellData }) => {
                            return (new Date(cellData)).toLocaleDateString(locale, {
                              day: "numeric",
                              hour: "numeric",
                              minute: "numeric",
                              month: "numeric",
                              year: "numeric",
                            });
                          }}
                          dataKey="notAfter"
                          disableSort={false}
                          headerRenderer={this.headerRenderer}
                          width={width * 0.15}
                          label={localize("Certificate.cert_valid", locale)}
                        />
                        <Column
                          cellRenderer={({ cellData, rowData, rowIndex }) => {
                            return (
                              <div className="row nobottom valign-wrapper" >
                                <div className="col s12" >
                                  <div
                                    className="collection-title truncate"
                                    onClick={() => window.electron.shell.openExternal(cellData)}
                                    style={{ color: "#334294", cursor: "pointer" }}>
                                    {cellData}
                                  </div>
                                </div>
                              </div>);
                          }
                          }
                          dataKey="url"
                          headerRenderer={this.headerRenderer}
                          width={width * 0.2}
                          label={localize("TrustedServices.site", locale)}
                        />
                      </Table>
                    )}
                  </AutoSizer>

              }
            </Media>

          </div>
        </div>
      </React.Fragment>
    );
  }

  handleOnRowMouseOver = ({ event, index, rowData }: { event: Event, index: number, rowData: any }) => {
    if (this.state.hoveredRowIndex !== index) {
      this.setState({
        hoveredRowIndex: index,
      });
    }
  }

  handleOnRowMouseOut = () => {
    this.setState({
      hoveredRowIndex: -1,
    });
  }

  handleOnRowClick = ({ rowData }: { rowData: any }) => {
    const { activeCert, toggleOpenItem } = this.props;

    const pkiCertificate = new trusted.pki.Certificate();

    try {
      pkiCertificate.import(Buffer.from(rowData.x509), trusted.DataFormat.PEM);
    } catch (e) {
      // tslint:disable-next-line: no-console
      console.log("Error addTrustedService", e);
      return;
    }

    activeCert({ ...rowData, object: pkiCertificate });
  }

  getDatum = (list: any, index: number) => {
    const arr = mapToArr(list);

    return arr[index];
  }

  rowClassName = ({ index }: { index: number }) => {
    const { foundEvents } = this.state;
    const rowData = this.getDatum(this.state.sortedList, index);

    if (index < 0) {
      return "headerRow";
    } else {
      let rowClassName = index % 2 === 0 ? "evenRow " : "oddRow ";

      const founded = foundEvents.indexOf(index) >= 0;
      const selected = this.props.selectedCert ? this.props.selectedCert.url === rowData.url : false;

      if (founded && selected) {
        rowClassName += "foundAndSelectedEvent ";
      } else if (founded) {
        rowClassName += "foundEvent ";
      } else if (selected) {
        rowClassName += "selectedRow ";
      }

      if (index === this.state.hoveredRowIndex) {
        rowClassName += "hoverRow";
      }

      return rowClassName;
    }
  }

  sort = ({ sortBy, sortDirection }: { sortBy: string, sortDirection: TSortDirection }) => {
    const sortedList = this.sortList({ sortBy, sortDirection });

    this.setState({ sortBy, sortDirection, sortedList });
  }

  sortList = ({ sortBy, sortDirection }: { sortBy: string, sortDirection: TSortDirection }) => {
    const { eventsMap } = this.props;

    return eventsMap
      .sortBy((item: any) => item[sortBy])
      .update(
        // tslint:disable-next-line:no-shadowed-variable
        (eventsMap: any) => (sortDirection === SortDirection.DESC ? eventsMap.reverse() : eventsMap),
      );
  }

  headerRenderer = ({ dataKey, label, sortBy, sortDirection }: { dataKey?: string, label?: string, sortBy?: string, sortDirection?: TSortDirection }) => {
    return (
      <React.Fragment>
        {label}
        {sortBy === dataKey && <SortIndicator sortDirection={sortDirection} />}
      </React.Fragment>
    );
  }

  noRowsRenderer = () => {
    const { locale, localize } = this.context;

    return <div className={"noRows"}>{localize("EventsTable.no_rows", locale)}</div>;
  }

  scrollToRow = (index: number) => {
    this.setState({ scrollToIndex: index });
  }
}

export default connect((state) => ({
  eventsMap: filteredTrustedServicesSelector(state),
  isLoading: state.events.loading,
}))(TrustedServicesTable);
