import PropTypes from "prop-types";
import React from "react";
import { connect } from "react-redux";
import { AutoSizer, Column, Table } from "react-virtualized";
import { loadAllEvents, removeAllEvents } from "../../AC/eventsActions";
import { filteredEventsSelector } from "../../selectors/eventsSelectors";
import "../../table.global.css";
import { mapToArr } from "../../utils";
import ProgressBars from "../ProgressBars";
import SortDirection from "../Sort/SortDirection";
import SortIndicator from "../Sort/SortIndicator";

type TSortDirection = "ASC" | "DESC" | undefined;

interface IEventTableProps {
  eventsMap: any;
  isLoaded: boolean;
  isLoading: boolean;
  searchValue?: string;
}

interface IEventTableDispatch {
  loadAllEvents: () => void;
  removeAllEvents: () => void;
}

interface IEventTableState {
  disableHeader: boolean;
  foundEvents: number[];
  scrollToIndex: number;
  sortBy: string;
  sortDirection: TSortDirection;
  sortedList: any;
}

class EventTable extends React.Component<IEventTableProps & IEventTableDispatch, IEventTableState> {
  static contextTypes = {
    locale: PropTypes.string,
    localize: PropTypes.func,
  };

  constructor(props: IEventTableProps & IEventTableDispatch) {
    super(props);

    const sortBy = "timestamp";
    const sortDirection = SortDirection.DESC;
    const sortedList = this.sortList({ sortBy, sortDirection });

    this.state = {
      disableHeader: false,
      foundEvents: [],
      scrollToIndex: 0,
      sortBy,
      sortDirection,
      sortedList,
    };
  }

  componentDidMount() {
    // tslint:disable-next-line:no-shadowed-variable
    const { isLoading, loadAllEvents, removeAllEvents } = this.props;

    removeAllEvents();

    if (!isLoading) {
      loadAllEvents();
    }
  }

  componentDidUpdate(prevProps: IEventTableProps & IEventTableDispatch) {
    if (!prevProps.eventsMap.size && this.props.eventsMap && this.props.eventsMap.size ||
      (prevProps.eventsMap.size !== this.props.eventsMap.size)) {
      this.sort(this.state);
    }

    if (prevProps.searchValue !== this.props.searchValue && this.props.searchValue) {
      this.search(this.props.searchValue);
    }

    if (prevProps.searchValue && !this.props.searchValue) {
      this.setState({ foundEvents: [] });
    }
  }

  render() {
    const { locale, localize } = this.context;
    const { isLoading, searchValue } = this.props;
    const { disableHeader, foundEvents, scrollToIndex, sortBy, sortDirection, sortedList } = this.state;

    if (isLoading) {
      return <ProgressBars />;
    }

    const classDisabledNavigation = foundEvents.length && foundEvents.length === 1 ? "disabled" : "";

    const rowGetter = ({ index }: { index: number }) => this.getDatum(this.state.sortedList, index);

    return (
      <React.Fragment>
        <div style={{ display: "flex" }}>
          <div style={{ flex: "1 1 auto", height: "calc(100vh - 110px)" }}>
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
                  overscanRowCount={5}
                  rowGetter={rowGetter}
                  rowCount={sortedList.size}
                  scrollToIndex={scrollToIndex}
                  sort={this.sort}
                  sortBy={sortBy}
                  sortDirection={sortDirection}
                >
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
                    dataKey="timestamp"
                    disableSort={false}
                    headerRenderer={this.headerRenderer}
                    width={150}
                    label={localize("EventsTable.date_and_time", locale)}
                  />
                  <Column
                    dataKey="operation"
                    disableSort={false}
                    headerRenderer={this.headerRenderer}
                    width={width * 0.2}
                    label={localize("EventsTable.operation", locale)}
                  />
                  <Column
                    dataKey="userName"
                    disableSort={false}
                    headerRenderer={this.headerRenderer}
                    width={width * 0.15}
                    label={localize("EventsTable.user_name", locale)}
                  />
                  <Column
                    cellRenderer={({ cellData }) => {
                      return (
                        <div className="row nobottom">
                          <div className="col s12">
                            <div className="truncate">{cellData.in}</div>
                            <div className="truncate" style={{ opacity: .6 }}> -> {cellData.out}</div>
                          </div>
                        </div>
                      );
                    }}
                    dataKey="operationObject"
                    disableSort
                    headerRenderer={this.headerRenderer}
                    width={width * 0.6}
                    label={localize("EventsTable.operation_object", locale)}
                  />
                  <Column
                    cellRenderer={({ cellData }) => {
                      let iconStatus;

                      switch (cellData) {
                        case "info":
                          iconStatus = "icon_operation_status_success";
                          break;
                        case "error":
                          iconStatus = "icon_operation_status_error";
                          break;
                      }

                      return (
                        <div className="row nobottom">
                          <div className="valign-wrapper">
                            <div className="col s12">
                              <div className={iconStatus}></div>
                            </div>
                          </div>
                        </div>
                      );
                    }}
                    dataKey="level"
                    disableSort={false}
                    headerRenderer={this.headerRenderer}
                    width={width * 0.07}
                    label={localize("EventsTable.status", locale)}
                  />
                </Table>
              )}
            </AutoSizer>
          </div>
        </div>
        {searchValue && foundEvents.length ?
          <div className="card navigationToolbar valign-wrapper" style={{right: "50px"}}>
            <i className={"small material-icons cryptoarm-blue waves-effect " + classDisabledNavigation} onClick={this.handleScrollToFirstOfFoud}>first_page</i>
            <i className={"small material-icons cryptoarm-blue waves-effect " + classDisabledNavigation} onClick={this.handleScrollToBefore}>navigate_before</i>
            <div style={{ color: "black" }}>
              {foundEvents.indexOf(scrollToIndex) + 1}/{foundEvents.length}
            </div>
            <i className={"small material-icons cryptoarm-blue waves-effect " + classDisabledNavigation} onClick={this.handleScrollToNext}>navigate_next</i>
            <i className={"small material-icons cryptoarm-blue waves-effect " + classDisabledNavigation} onClick={this.handleScrollToLastOfFoud}>last_page</i>
          </div> :
          null}
      </React.Fragment>
    );
  }

  handleScrollToBefore = () => {
    const { foundEvents, scrollToIndex } = this.state;

    if (foundEvents.indexOf(scrollToIndex) - 1 >= 0) {
      this.scrollToRow(foundEvents[foundEvents.indexOf(scrollToIndex) - 1]);
    }
  }

  handleScrollToNext = () => {
    const { foundEvents, scrollToIndex } = this.state;

    if (foundEvents.indexOf(scrollToIndex) + 1 < foundEvents.length) {
      this.scrollToRow(foundEvents[foundEvents.indexOf(scrollToIndex) + 1]);
    }
  }

  handleScrollToFirstOfFoud = () => {
    const { foundEvents } = this.state;

    this.scrollToRow(foundEvents[0]);
  }

  handleScrollToLastOfFoud = () => {
    const { foundEvents } = this.state;

    this.scrollToRow(foundEvents[foundEvents.length - 1]);
  }

  getDatum = (list: any, index: number) => {
    const arr = mapToArr(list);

    return arr[index];
  }

  rowClassName = ({ index }: { index: number }) => {
    const { foundEvents } = this.state;

    if (index < 0) {
      return "headerRow";
    } else {
      let rowClassName = index % 2 === 0 ? "evenRow " : "oddRow ";

      if (foundEvents.indexOf(index) >= 0) {
        rowClassName += "foundEvent";
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
      this.setState({ foundEvents: [] });
      return;
    }

    const arr = list ? mapToArr(list) : mapToArr(sortedList);

    const foundEvents: number[] = [];
    const search = searchValue.toLowerCase();

    arr.forEach((event: any, index: number) => {
      try {
        if (event.userName.toLowerCase().match(search) ||
          event.operationObject.in.toLowerCase().match(search) ||
          event.operationObject.out.toLowerCase().match(search) ||
          event.level.toLowerCase().match(search) ||
          (new Date(event.timestamp)).toLocaleDateString(locale, {
            day: "numeric",
            hour: "numeric",
            minute: "numeric",
            month: "numeric",
            year: "numeric",
          }).toLowerCase().match(search) ||
          event.operation.toLowerCase().match(search)) {

          foundEvents.push(index);
        }
      } catch (e) {
        //
      }
    });

    if (!foundEvents.length) {
      $(".toast-no_found_events").remove();
      Materialize.toast(localize("EventsFilters.no_found_events", locale), 2000, "toast-no_found_events");
    }

    this.scrollToRow(foundEvents[0]);

    this.setState({ foundEvents });
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
  eventsMap: filteredEventsSelector(state),
  isLoaded: state.events.loaded,
  isLoading: state.events.loading,
}), { loadAllEvents, removeAllEvents })(EventTable);
