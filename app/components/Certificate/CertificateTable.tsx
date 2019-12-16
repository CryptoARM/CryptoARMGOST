import { is } from "immutable";
import * as path from "path";
import PropTypes from "prop-types";
import React from "react";
import Media from "react-media";
import { connect } from "react-redux";
import { AutoSizer, Column, Table } from "react-virtualized";
import { activeFile, deleteFile, selectTempContentOfSignedFiles } from "../../AC";
import { activeFilesSelector, filteredFilesSelector, loadingRemoteFilesSelector, filteredCertificatesSelector } from "../../selectors";
import "../../table.global.css";
import { bytesToSize, mapToArr } from "../../utils";
import ProgressBars from "../ProgressBars";
import SortDirection from "../Sort/SortDirection";
import SortIndicator from "../Sort/SortIndicator";
import CertificateStatusIcon from "./CertificateStatusIcon";

type TSortDirection = "ASC" | "DESC" | undefined;

interface IFileRedux {
  active: boolean;
  extension: string;
  filename: string;
  fullpath: string;
  id: number;
  mtime: Date;
  socket: string;
}

export interface IRemoteFile {
  extra: any;
  id: number;
  loaded: boolean;
  loading: boolean;
  name: string;
  socketId: string;
  totalSize: number;
  url: string;
}

interface ICertificateTableProps {
  activeFile: (id: number, active?: boolean) => void;
  deleteFile: (fileId: number) => void;
  loadingFiles: IRemoteFile[];
  location: any;
  certificatesMap: any;
  operation: string;
  selectedFilesPackage: boolean;
  selectingFilesPackage: boolean;
  style: any;
}

interface ICertificateTableDispatch {
  loadAllCertificates: () => void;
  selectDocument: (uid: number) => void;
  unselectAllDocuments: () => void;
}

interface ICertificateTableState {
  disableHeader: boolean;
  hoveredRowIndex: number;
  foundDocuments: number[];
  scrollToIndex: number;
  sortBy: string;
  sortDirection: TSortDirection;
  sortedList: any;
}

class CertificateTable extends React.Component<ICertificateTableProps & ICertificateTableDispatch, ICertificateTableState> {
  static contextTypes = {
    locale: PropTypes.string,
    localize: PropTypes.func,
  };

  constructor(props: ICertificateTableProps & ICertificateTableDispatch) {
    super(props);

    const sortBy = "filename";
    const sortDirection = SortDirection.DESC;
    const sortedList = this.sortList({ sortBy, sortDirection });

    this.state = {
      disableHeader: false,
      foundDocuments: [],
      hoveredRowIndex: -1,
      scrollToIndex: 0,
      sortBy,
      sortDirection,
      sortedList,
    };
  }

  componentDidUpdate(prevProps: ICertificateTableProps & ICertificateTableDispatch) {
    if (!prevProps.certificatesMap.size && this.props.certificatesMap && this.props.certificatesMap.size ||
      (prevProps.certificatesMap.size !== this.props.certificatesMap.size)) {
      this.sort(this.state);
    }
    if (prevProps.searchValue !== this.props.searchValue && this.props.searchValue) {
      this.search(this.props.searchValue);
    }

    if (prevProps.searchValue && !this.props.searchValue) {
      this.setState({ foundDocuments: [] });
    }
  }

  componentDidMount() {
    if (this.props.searchValue) {
      this.search(this.props.searchValue);
    }
  }

  render() {
    const { locale, localize } = this.context;
    const { certificatesMap, searchValue } = this.props;
    const { disableHeader, foundDocuments, scrollToIndex, sortBy, sortDirection, sortedList } = this.state;

    const rowGetter = ({ index }: { index: number }) => this.getDatum(this.state.sortedList, index);

    if (!certificatesMap.size) {
      return null;
    }

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
                        overscanRowCount={3}
                        rowGetter={rowGetter}
                        rowCount={sortedList.size}
                        scrollToIndex={scrollToIndex}
                        sort={this.sort}
                        sortBy={sortBy}
                        sortDirection={sortDirection}
                      >
                        <Column
                          cellRenderer={({ cellData, rowData, rowIndex }) => {
                            let curKeyStyle;
                            curKeyStyle = rowData.key.length > 0 ? curKeyStyle = "key " : curKeyStyle = "";

                            if (curKeyStyle) {
                              if (rowData.dssUserID) {
                                curKeyStyle += "dsskey";
                              } else {
                                curKeyStyle += "localkey";
                              }
                            }

                            return (
                              <div className="row nobottom valign-wrapper">
                                <div className="col" style={{ width: "40px", paddingLeft: "0px" }}>
                                  <CertificateStatusIcon certificate={rowData} key={rowData.id} />
                                </div>
                                <div className="col s10">
                                  <div className="collection-title truncate">{cellData}</div>
                                  <div className="collection-info truncate">{rowData.issuerFriendlyName}</div>
                                </div>
                                <div className="col s1">
                                  <div className={curKeyStyle} />
                                </div>
                              </div>);
                          }
                          }
                          dataKey="subjectFriendlyName"
                          headerRenderer={this.headerRenderer}
                          width={width * 1}
                          label={localize("Certificate.subject", locale)}
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
                        overscanRowCount={3}
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
                                  <CertificateStatusIcon certificate={rowData} key={rowData.id} />
                                </div>
                                <div className="col s10" style={{ marginLeft: "10px" }}>
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
                          width={width * 0.4}
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
                            let curKeyStyle;
                            curKeyStyle = rowData.key.length > 0 ? curKeyStyle = "key " : curKeyStyle = "";

                            if (curKeyStyle) {
                              if (rowData.dssUserID) {
                                curKeyStyle += "dsskey";
                              } else {
                                curKeyStyle += "localkey";
                              }
                            }

                            return <div className={curKeyStyle} />;
                          }
                          }
                          headerRenderer={this.headerRenderer}
                          width={width * 0.05}
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

    activeCert(rowData);
    toggleOpenItem(rowData.id.toString());
  }

  handleScrollToBefore = () => {
    const { foundDocuments, scrollToIndex } = this.state;

    if (foundDocuments.indexOf(scrollToIndex) - 1 >= 0) {
      this.scrollToRow(foundDocuments[foundDocuments.indexOf(scrollToIndex) - 1]);
    }
  }

  handleScrollToNext = () => {
    const { foundDocuments, scrollToIndex } = this.state;

    if (foundDocuments.indexOf(scrollToIndex) + 1 < foundDocuments.length) {
      this.scrollToRow(foundDocuments[foundDocuments.indexOf(scrollToIndex) + 1]);
    }
  }

  handleScrollToFirstOfFoud = () => {
    const { foundDocuments } = this.state;

    this.scrollToRow(foundDocuments[0]);
  }

  handleScrollToLastOfFoud = () => {
    const { foundDocuments } = this.state;

    this.scrollToRow(foundDocuments[foundDocuments.length - 1]);
  }

  getDatum = (list: any, index: number) => {
    const arr = mapToArr(list);

    return arr[index];
  }

  rowClassName = ({ index }: { index: number }) => {
    const { foundDocuments } = this.state;
    const rowData = this.getDatum(this.state.sortedList, index);

    if (index < 0) {
      return "headerRow";
    } else {
      let rowClassName = index % 2 === 0 ? "evenRow " : "oddRow ";

      const founded = foundDocuments.indexOf(index) >= 0;
      const selected = this.props.selectedCert ? this.props.selectedCert.id === rowData.id : false;

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

    this.search(this.props.searchValue, sortedList);
  }

  search = (searchValue: string | undefined, list?: any) => {
    const { locale, localize } = this.context;
    const { sortedList } = this.state;

    if (!searchValue) {
      this.setState({ foundDocuments: [] });
      return;
    }

    const arr = list ? mapToArr(list) : mapToArr(sortedList);

    const foundDocuments: number[] = [];
    const search = searchValue.toLowerCase();

    arr.forEach((document: any, index: number) => {
      try {
        if (document.filename.toLowerCase().match(search)) {
          foundDocuments.push(index);
        }
      } catch (e) {
        //
      }

    });

    if (!foundDocuments.length) {
      $(".toast-no_found_events").remove();
      Materialize.toast(localize("EventsFilters.no_found_events", locale), 2000, "toast-no_found_events");
    }

    this.scrollToRow(foundDocuments[0]);

    this.setState({ foundDocuments });
  }

  sortList = ({ sortBy, sortDirection }: { sortBy: string, sortDirection: TSortDirection }) => {
    const { certificatesMap } = this.props;

    return certificatesMap
      .sortBy((item: any) => item[sortBy])
      .update(
        // tslint:disable-next-line:no-shadowed-variable
        (certificatesMap: any) => (sortDirection === SortDirection.DESC ? certificatesMap.reverse() : certificatesMap),
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

interface IOwnProps {
  operation: string;
}

export default connect((state, ownProps: IOwnProps) => ({
  certificatesMap: filteredCertificatesSelector(state, { operation: ownProps.operation }),
}), { activeFile, deleteFile, selectTempContentOfSignedFiles })(CertificateTable);
