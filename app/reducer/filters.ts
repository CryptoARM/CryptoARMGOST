import {
  APPLY_DOCUMENTS_FILTERS, APPLY_EVENTS_FILTERS, CERTIFICATE_GENERATION, CERTIFICATE_IMPORT, CHANGE_SEARCH_VALUE,
  CRL_IMPORT, CSR_GENERATION, DECRYPT,
  DELETE_CERTIFICATE, DELETE_CONTAINER, ENCRYPT, ENCRYPTED, EVENTS_CHANGE_FILTER_DATE_FROM,
  EVENTS_CHANGE_FILTER_DATE_TO, EVENTS_CHANGE_FILTER_IN_OPERATION_OBJECT, EVENTS_CHANGE_FILTER_LEVEL,
  EVENTS_CHANGE_FILTER_OPERATION_TYPE, EVENTS_CHANGE_FILTER_OUT_OPERATION_OBJECT, EVENTS_CHANGE_FILTER_USER_NAME,
  PKCS12_IMPORT, RESET_DOCUMENTS_FILTERS, RESET_EVENTS_FILTERS, SIGN, SIGNED, UNSIGN, SENT_SERVICE, DELETE_SERVICE, ADD_SERVICE,REQUEST_CERTIFICATE
} from "../constants";

const defaultFilters = {
  documents: {
    dateFrom: undefined,
    dateTo: undefined,
    filename: "",
    isDefaultFilters: true,
    sizeFrom: undefined,
    sizeTo: undefined,
    types: {
      ENCRYPTED: false,
      SIGNED: false,
    },
  },
  events: {
    dateFrom: undefined,
    dateTo: undefined,
    isDefaultFilters: true,
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
      UNSIGN: true,
      SENT_SERVICE: true,
      DELETE_SERVICE: true,
      ADD_SERVICE: true,
      REQUEST_CERTIFICATE: true,
    },
    userName: "",
  },
  searchValue: "",
};

export default (filters = defaultFilters, action) => {
  const { type, payload } = action;

  switch (type) {
    case APPLY_EVENTS_FILTERS:
      return {
        ...filters,
        events: {
          ...filters.events,
          ...payload.filters,
          isDefaultFilters: checkDefaultEventsFilters(payload.filters),
        },
      };

    case APPLY_DOCUMENTS_FILTERS:
      return {
        ...filters,
        documents: {
          ...filters.documents,
          ...payload.filters,
          isDefaultFilters: checkDefaultDocumentsFilters(payload.filters),
        },
      };

    case CHANGE_SEARCH_VALUE:
      return { ...filters, searchValue: payload.searchValue };

    case EVENTS_CHANGE_FILTER_USER_NAME:
      return {
        ...filters,
        events: {
          ...filters.events,
          isDefaultFilters: checkDefaultEventsFilters({ ...filters.events, userName: payload.userName }),
          userName: payload.userName,
        },
      };

    case EVENTS_CHANGE_FILTER_IN_OPERATION_OBJECT:
      return {
        ...filters,
        events: {
          ...filters.events,
          isDefaultFilters: checkDefaultEventsFilters({ ...filters.events, operationObjectIn: payload.operationObjectIn }),
          operationObjectIn: payload.operationObjectIn,
        },
      };

    case EVENTS_CHANGE_FILTER_OUT_OPERATION_OBJECT:
      return {
        ...filters,
        events: {
          ...filters.events,
          isDefaultFilters: checkDefaultEventsFilters({ ...filters.events, operationObjectOut: payload.operationObjectOut }),
          operationObjectOut: payload.operationObjectOut,
        },
      };

    case EVENTS_CHANGE_FILTER_OPERATION_TYPE:
      return {
        ...filters,
        isDefaultFilters: checkDefaultEventsFilters({ ...filters.events, operations: { ...filters.events.operations, [payload.type]: payload.value } }),
        operations: {
          ...filters.events.operations,
          [payload.type]: payload.value,
        },
      };

    case EVENTS_CHANGE_FILTER_DATE_FROM:
      return {
        ...filters,
        events: {
          ...filters.events,
          dateFrom: payload.dateFrom,
          isDefaultFilters: checkDefaultEventsFilters({ ...filters.events, dateFrom: payload.dateFrom }),
        },
      };

    case EVENTS_CHANGE_FILTER_DATE_TO:
      return {
        ...filters,
        events: {
          ...filters.events,
          dateTo: payload.dateTo,
          isDefaultFilters: checkDefaultEventsFilters({ ...filters.events, dateTo: payload.dateTo }),
        },
      };

    case EVENTS_CHANGE_FILTER_LEVEL:
      return {
        ...filters,
        events: {
          ...filters.events,
          isDefaultFilters: checkDefaultEventsFilters({ ...filters.events, level: payload.level }),
        },
        level: payload.level,
      };

    case RESET_EVENTS_FILTERS:
      return {
        ...filters,
        events: {
          dateFrom: undefined,
          dateTo: undefined,
          isDefaultFilters: true,
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
            UNSIGN: true,
          },
          userName: "",
        },
      };

    case RESET_DOCUMENTS_FILTERS:
      return {
        ...filters,
        documents: {
          dateFrom: undefined,
          dateTo: undefined,
          filename: "",
          isDefaultFilters: true,
          sizeFrom: undefined,
          sizeTo: undefined,
          types: {
            ENCRYPTED: false,
            SIGNED: false,
          },
        },
      };
  }

  return filters;
};

const checkDefaultDocumentsFilters = (filters: any) => {
  if (
    defaultFilters.documents.dateFrom === filters.dateFrom &&
    defaultFilters.documents.dateTo === filters.dateTo &&
    defaultFilters.documents.filename === filters.filename &&
    defaultFilters.documents.sizeFrom === filters.sizeFrom &&
    defaultFilters.documents.sizeTo === filters.sizeTo &&
    defaultFilters.documents.types.ENCRYPTED === filters.types.ENCRYPTED &&
    defaultFilters.documents.types.SIGNED === filters.types.SIGNED
  ) {
    return true;
  }

  return false;
};

const checkDefaultEventsFilters = (filters: any) => {
  if (
    defaultFilters.events.dateFrom === filters.dateFrom &&
    defaultFilters.events.dateTo === filters.dateTo &&
    (defaultFilters.events.level === filters.level || filters.level === undefined) &&
    defaultFilters.events.operationObjectIn === filters.operationObjectIn &&
    defaultFilters.events.operationObjectOut === filters.operationObjectOut &&
    defaultFilters.events.operations.CERTIFICATE_GENERATION === filters.operations.CERTIFICATE_GENERATION &&
    defaultFilters.events.operations.CERTIFICATE_IMPORT === filters.operations.CERTIFICATE_IMPORT &&
    defaultFilters.events.operations.CRL_IMPORT === filters.operations.CRL_IMPORT &&
    defaultFilters.events.operations.CSR_GENERATION === filters.operations.CSR_GENERATION &&
    defaultFilters.events.operations.DECRYPT === filters.operations.DECRYPT &&
    defaultFilters.events.operations.DELETE_CERTIFICATE === filters.operations.DELETE_CERTIFICATE &&
    defaultFilters.events.operations.DELETE_CONTAINER === filters.operations.DELETE_CONTAINER &&
    defaultFilters.events.operations.PKCS12_IMPORT === filters.operations.PKCS12_IMPORT &&
    defaultFilters.events.operations.SIGN === filters.operations.SIGN &&
    defaultFilters.events.operations.UNSIGN === filters.operations.UNSIGN &&
    defaultFilters.events.userName === filters.userName
  ) {
    return true;
  }

  return false;
};
