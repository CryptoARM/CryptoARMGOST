import PropTypes from "prop-types";
import React from "react";
import ReactDOM from "react-dom";
import { connect } from "react-redux";
import { applyEventsFilters, resetEventsFilters } from "../../AC/eventsFiltersActions";
import {
  ALL, CERTIFICATE_GENERATION, CERTIFICATE_IMPORT, CRL_IMPORT,
  CSR_GENERATION, DECRYPT,
  DELETE_CERTIFICATE, DELETE_CONTAINER, ENCRYPT,
  PKCS12_IMPORT, SIGN, UNSIGN, DELETE_SERVICE, ADD_SERVICE, SENT_SERVICE,REQUEST_CERTIFICATE,
} from "../../constants";
import DatePicker from "../DatePicker";

interface IFilterEventsProps {
  applyEventsFilters: (filters: IEventsFilters) => void;
  dateFrom: Date;
  dateTo: Date;
  level: string;
  onCancel?: () => void;
  operations: any;
  operationObjectIn: string;
  operationObjectOut: string;
  resetEventsFilters: () => void;
  userName: string;
}

interface IEventsFilters {
  dateFrom: Date | undefined;
  dateTo: Date | undefined;
  level: string;
  operationObjectIn: string;
  operationObjectOut: string;
  operations: {
    CERTIFICATE_GENERATION: boolean;
    CERTIFICATE_IMPORT: boolean;
    CRL_IMPORT: boolean;
    CSR_GENERATION: boolean;
    DECRYPT: boolean;
    DELETE_CERTIFICATE: boolean;
    DELETE_CONTAINER: boolean;
    ENCRYPT: boolean;
    PKCS12_IMPORT: boolean;
    SIGN: boolean;
    UNSIGN: boolean;
    ADD_SERVICE: boolean;
    DELETE_SERVICE: boolean;
    SENT_SERVICE: boolean;
    REQUEST_CERTIFICATE: boolean;
    [key: string]: boolean;
  };
  userName: string;
}

const initialState = {
  dateFrom: undefined,
  dateTo: undefined,
  level: "all",
  operationObjectIn: "",
  operationObjectOut: "",
  operations: {
    CERTIFICATE_GENERATION: true,
    CERTIFICATE_IMPORT: true,
    CRL_IMPORT: true,
    CSR_GENERATION: true,
    DECRYPT: true,
    DELETE_CERTIFICATE: true,
    DELETE_CONTAINER: true,
    ENCRYPT: true,
    PKCS12_IMPORT: true,
    SIGN: true,
    ADD_SERVICE: true,
    DELETE_SERVICE: true,
    SENT_SERVICE:true,
    UNSIGN: true,
    REQUEST_CERTIFICATE: true,
  },
  userName: "",
};

class FilterEvents extends React.Component<IFilterEventsProps, IEventsFilters> {
  static contextTypes = {
    locale: PropTypes.string,
    localize: PropTypes.func,
  };

  constructor(props: IFilterEventsProps) {
    super(props);

    this.state = { ...initialState, dateFrom: props.dateFrom, dateTo: props.dateTo };
  }

  componentDidMount() {
    const { dateFrom, dateTo, level, operationObjectIn, operationObjectOut, operations, userName } = this.props;

    this.setState({ dateFrom, dateTo, level, operationObjectIn, operationObjectOut, operations, userName });

    /* https://github.com/facebook/react/issues/3667
    * fix onChange for < select >
    */
    $(document).ready(() => {
      $("select").material_select();
    });

    $(document).ready(function () {
      $(".tooltipped").tooltip();
    });

    $(ReactDOM.findDOMNode(this.refs.operationSelect)).on("change", this.handleChangeFilterLevel);

    Materialize.updateTextFields();
  }

  componentDidUpdate() {
    Materialize.updateTextFields();
  }

  componentWillUnmount() {
    this.handelCancel();
  }

  render() {
    const { dateFrom, dateTo, level, operations, operationObjectIn, operationObjectOut, userName } = this.state;
    const { localize, locale } = this.context;

    return (
      <div className="filter_setting_modal">
        <div className="row halftop">
          <div className="col s12">
            <div className="content-wrapper tbody border_group">
              <div className="col s6">
                <div className="row" />
                <div className="row">
                  <div className="input-field input-field-csr col s12">
                    <input
                      id="userName"
                      type="text"
                      className={"validate"}
                      name="userName"
                      value={userName}
                      placeholder={localize("EventsFilters.write_user_name", locale)}
                      onChange={this.handleUserChange}
                    />
                    <label htmlFor="userName">
                      {localize("EventsTable.user_name", locale)}
                    </label>
                  </div>
                </div>
                <div className="row">
                  <div className="input-field input-field-csr col s12">
                    <select className="select" ref="operationSelect" defaultValue={level} onChange={this.handleChangeFilterLevel} >>
                      <option value={"all"}>{localize("EventsFilters.level_all", locale)}</option>
                      <option value={"info"}>{localize("EventsFilters.level_info", locale)}</option>
                      <option value={"error"}>{localize("EventsFilters.level_error", locale)}</option>
                    </select>
                    <label>{localize("EventsTable.status", locale)}</label>
                  </div>
                </div>
                <div className="row nobottom">
                  <div className="col s12">
                    <p className="label-csr">
                      {localize("EventsFilters.date", locale)}
                    </p>
                  </div>
                  <div className="col s6">
                    <DatePicker
                      id="input_from"
                      key="input_from"
                      label="From"
                      onClear={() => {
                        this.setState({ dateFrom: undefined });
                      }}
                      onSelect={this.handleFromChange}
                      selected={dateFrom}
                    />
                  </div>
                  <div className="col s6">
                    <DatePicker
                      id="input_to"
                      key="input_to"
                      label="To"
                      min={dateFrom}
                      onClear={() => {
                        this.setState({ dateTo: undefined });
                      }}
                      onSelect={this.handleToChange}
                      selected={dateTo}
                    />
                  </div>
                </div>
                <div className="row">
                  <div className="input-field input-field-csr col s12">
                    <input
                      id="objectIn"
                      type="text"
                      className={"validate"}
                      name="objectIn"
                      value={operationObjectIn}
                      placeholder={localize("EventsFilters.write_object_for_filter", locale)}
                      onChange={this.handleChangeFilterInObject}
                    />
                    <label htmlFor="objectIn">
                      {localize("EventsTable.operation_object", locale)}
                    </label>
                  </div>
                </div>
                <div className="row">
                  <div className="input-field input-field-csr col s12">
                    <input
                      id="objectOut"
                      type="text"
                      className={"validate"}
                      name="objectOut"
                      value={operationObjectOut}
                      placeholder={localize("EventsFilters.write_object_for_filter", locale)}
                      onChange={this.handleChangeFilterOutObject}
                    />
                    <label htmlFor="objectOut">
                      {localize("EventsTable.operation_result", locale)}
                    </label>
                  </div>
                </div>
              </div>
              <div className="col s6">
                <div className="row">
                  <p className="label-csr">
                    {localize("EventsTable.operation", locale)}
                  </p>
                  <div className="operations_group">
                    <div className="row">
                      <div className="col s12">
                        <div className="row halfbottom" />
                        <div className="input-checkbox">
                          <input
                            name={ALL}
                            type="checkbox"
                            id={ALL}
                            className="filled-in"
                            checked={this.isAllOperationsChecked()}
                            onChange={this.handleAllOperationTypesClick}
                          />
                          <label htmlFor={ALL} className="truncate">
                            {localize("EventsFilters.all", locale)}
                          </label>
                        </div>
                        <div className="input-checkbox">
                          <input
                            name={SIGN}
                            type="checkbox"
                            id={SIGN}
                            className="filled-in"
                            checked={operations.SIGN}
                            onChange={this.handleOperationTypesChange}
                          />
                          <label htmlFor={SIGN} className="truncate">
                            {localize("EventsFilters.sign", locale)}
                          </label>
                        </div>
                        <div className="input-checkbox">
                          <input
                            name={UNSIGN}
                            type="checkbox"
                            id={UNSIGN}
                            className="filled-in"
                            checked={operations.UNSIGN}
                            onChange={this.handleOperationTypesChange}
                          />
                          <label htmlFor={UNSIGN} className="truncate">
                            {localize("EventsFilters.unsign", locale)}
                          </label>
                        </div>
                        <div className="input-checkbox">
                          <input
                            name={ENCRYPT}
                            type="checkbox"
                            id={ENCRYPT}
                            className="filled-in"
                            checked={operations.ENCRYPT}
                            onChange={this.handleOperationTypesChange}
                          />
                          <label htmlFor={ENCRYPT} className="truncate">
                            {localize("EventsFilters.encrypt", locale)}
                          </label>
                        </div>
                        <div className="input-checkbox">
                          <input
                            name={DECRYPT}
                            type="checkbox"
                            id={DECRYPT}
                            className="filled-in"
                            checked={operations.DECRYPT}
                            onChange={this.handleOperationTypesChange}
                          />
                          <label htmlFor={DECRYPT} className="truncate">
                            {localize("EventsFilters.decrypt", locale)}
                          </label>
                        </div>
                        <div className="input-checkbox">
                          <input
                            name={CERTIFICATE_GENERATION}
                            type="checkbox"
                            id={CERTIFICATE_GENERATION}
                            className="filled-in"
                            checked={operations.CERTIFICATE_GENERATION}
                            onChange={this.handleOperationTypesChange}
                          />
                          <label htmlFor={CERTIFICATE_GENERATION} className="truncate">
                            {localize("EventsFilters.certificate_generation", locale)}
                          </label>
                        </div>
                        <div className="input-checkbox">
                          <input
                            name={CSR_GENERATION}
                            type="checkbox"
                            id={CSR_GENERATION}
                            className="filled-in"
                            checked={operations.CSR_GENERATION}
                            onChange={this.handleOperationTypesChange}
                          />
                          <label htmlFor={CSR_GENERATION} className="truncate">
                            {localize("EventsFilters.csr_generation", locale)}
                          </label>
                        </div>
                        <div className="input-checkbox">
                          <input
                            name={CERTIFICATE_IMPORT}
                            type="checkbox"
                            id={CERTIFICATE_IMPORT}
                            className="filled-in"
                            checked={operations.CERTIFICATE_IMPORT}
                            onChange={this.handleOperationTypesChange}
                          />
                          <label htmlFor={CERTIFICATE_IMPORT} className="truncate">
                            {localize("EventsFilters.certificate_import", locale)}
                          </label>
                        </div>
                        <div className="input-checkbox">
                          <input
                            name={CRL_IMPORT}
                            type="checkbox"
                            id={CRL_IMPORT}
                            className="filled-in"
                            checked={operations.CRL_IMPORT}
                            onChange={this.handleOperationTypesChange}
                          />
                          <label htmlFor={CRL_IMPORT} className="truncate">
                            {localize("EventsFilters.crl_import", locale)}
                          </label>
                        </div>
                        <div className="input-checkbox">
                          <input
                            name={PKCS12_IMPORT}
                            type="checkbox"
                            id={PKCS12_IMPORT}
                            className="filled-in"
                            checked={operations.PKCS12_IMPORT}
                            onChange={this.handleOperationTypesChange}
                          />
                          <label htmlFor={PKCS12_IMPORT} className="truncate">
                            {localize("EventsFilters.pkcs12_import", locale)}
                          </label>
                        </div>
                        <div className="input-checkbox">
                          <input
                            name={DELETE_CERTIFICATE}
                            type="checkbox"
                            id={DELETE_CERTIFICATE}
                            className="filled-in"
                            checked={operations.DELETE_CERTIFICATE}
                            onChange={this.handleOperationTypesChange}
                          />
                          <label htmlFor={DELETE_CERTIFICATE} className="truncate">
                            {localize("EventsFilters.delete_certificate", locale)}
                          </label>
                        </div>
                        <div className="input-checkbox">
                          <input
                            name={DELETE_CONTAINER}
                            type="checkbox"
                            id={DELETE_CONTAINER}
                            className="filled-in"
                            checked={operations.DELETE_CONTAINER}
                            onChange={this.handleOperationTypesChange}
                          />
                          <label htmlFor={DELETE_CONTAINER} className="truncate">
                            {localize("EventsFilters.delete_container", locale)}
                          </label>
                        </div>
                        <div className="input-checkbox">
                          <input
                            name={DELETE_SERVICE}
                            type="checkbox"
                            id={DELETE_SERVICE}
                            className="filled-in"
                            checked={operations.DELETE_SERVICE}
                            onChange={this.handleOperationTypesChange}
                          />
                          <label htmlFor={DELETE_SERVICE} className="truncate">
                            {localize("EventsFilters.delete_service", locale)}
                          </label>
                        </div>
                        <div className="input-checkbox">
                          <input
                            name={ADD_SERVICE}
                            type="checkbox"
                            id={ADD_SERVICE}
                            className="filled-in"
                            checked={operations.ADD_SERVICE}
                            onChange={this.handleOperationTypesChange}
                          />
                          <label htmlFor={ADD_SERVICE} className="truncate">
                            {localize("EventsFilters.add_service", locale)}
                          </label>
                        </div>
                        <div className="input-checkbox">
                          <input
                            name={SENT_SERVICE}
                            type="checkbox"
                            id={SENT_SERVICE}
                            className="filled-in"
                            checked={operations.SENT_SERVICE}
                            onChange={this.handleOperationTypesChange}
                          />
                          <label htmlFor={SENT_SERVICE} className="truncate">
                            {localize("EventsFilters.sent_service", locale)}
                          </label>
                        </div>
                        <div className="input-checkbox">
                          <input
                            name={REQUEST_CERTIFICATE}
                            type="checkbox"
                            id={REQUEST_CERTIFICATE}
                            className="filled-in"
                            checked={operations.REQUEST_CERTIFICATE}
                            onChange={this.handleOperationTypesChange}
                          />
                          <label htmlFor={REQUEST_CERTIFICATE} className="truncate">
                            {localize("EventsFilters.create_request_created", locale)}
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="row halfbottom" />

        <div className="row">
          <div style={{ float: "left" }}>
            <div style={{ display: "inline-block", margin: "10px" }}>
              <a className={"btn btn-text waves-effect waves-light"} onClick={this.handleResetFilters}>{localize("Common.reset", locale)}</a>
            </div>

          </div>
          <div style={{ float: "right" }}>
            <div style={{ display: "inline-block", margin: "10px" }}>
              <a className={"btn btn-text waves-effect waves-light modal-close"} onClick={this.handelCancel}>{localize("Common.cancel", locale)}</a>
            </div>
            <div style={{ display: "inline-block", margin: "10px" }}>
              <a className={"btn btn-outlined waves-effect waves-light modal-close"} onClick={this.handleApplyFilters}>{localize("Common.apply", locale)}</a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  isAllOperationsChecked = () => {
    const { operations } = this.state;

    return operations.CERTIFICATE_GENERATION &&
      operations.CERTIFICATE_IMPORT &&
      operations.CRL_IMPORT &&
      operations.CSR_GENERATION &&
      operations.DECRYPT &&
      operations.DELETE_CERTIFICATE &&
      operations.DELETE_CONTAINER &&
      operations.ENCRYPT &&
      operations.PKCS12_IMPORT &&
      operations.SIGN &&
      operations.DELETE_SERVICE &&
      operations.ADD_SERVICE &&
      operations.SENT_SERVICE &&
      operations.REQUEST_CERTIFICATE &&
      operations.UNSIGN;
  }

  handelCancel = () => {
    const { onCancel } = this.props;

    if (onCancel) {
      onCancel();
    }
  }

  handleUserChange = (ev: any) => {
    this.setState({ userName: ev.target.value });
  }

  handleChangeFilterInObject = (ev: any) => {
    this.setState({ operationObjectIn: ev.target.value });
  }

  handleChangeFilterOutObject = (ev: any) => {
    this.setState({ operationObjectOut: ev.target.value });
  }

  handleChangeFilterLevel = (ev: any) => {
    this.setState({ level: ev.target.value });
  }

  handleFromChange = (ev: any) => {
    if (ev && ev.select) {
      this.setState({ dateFrom: new Date(ev.select) });
    }
  }

  handleToChange = (ev: any) => {
    if (ev && ev.select) {
      this.setState({ dateTo: new Date(ev.select) });
    }
  }

  handleAllOperationTypesClick = () => {
    const value = !this.isAllOperationsChecked();

    this.setState({
      operations: {
        CERTIFICATE_GENERATION: value,
        CERTIFICATE_IMPORT: value,
        CRL_IMPORT: value,
        CSR_GENERATION: value,
        DECRYPT: value,
        DELETE_CERTIFICATE: value,
        DELETE_CONTAINER: value,
        ENCRYPT: value,
        PKCS12_IMPORT: value,
        SIGN: value,
        UNSIGN: value,
        DELETE_SERVICE: value,
        ADD_SERVICE: value,
        SENT_SERVICE: value,
        REQUEST_CERTIFICATE,
      },
    });
  }

  handleOperationTypesChange = (ev: any) => {
    const target = ev.target;
    const name = target.name;

    this.setState({
      operations: {
        ...this.state.operations,
        [name]: !this.state.operations[name],
      },
    });
  }

  handleApplyFilters = () => {
    this.props.applyEventsFilters(this.state);

    this.handelCancel();
  }

  handleResetFilters = () => {
    this.setState({ ...initialState });
    this.props.resetEventsFilters();
  }
}

export default connect((state) => ({
  dateFrom: state.filters.events.dateFrom,
  dateTo: state.filters.events.dateTo,
  operationObjectIn: state.filters.events.operationObjectIn,
  operationObjectOut: state.filters.events.operationObjectOut,
  operations: state.filters.events.operations,
  userName: state.filters.events.userName,
}), {
    applyEventsFilters, resetEventsFilters,
  })(FilterEvents);
