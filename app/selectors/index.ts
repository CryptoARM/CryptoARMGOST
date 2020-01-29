import { List, OrderedMap } from "immutable";
import { createSelector } from "reselect";
import {
  ALL, ENCRYPTED, SIGNED,
} from "../constants";
import { mapToArr } from "../utils";

export const certificatesGetter = (state) => state.certificates.entities;
export const containersGetter = (state) => state.containers.entities;
export const filtersGetter = (state) => state.filters;
export const filesGetter = (state) => state.files.entities;
export const remoteFilesGetter = (state) => state.remoteFiles.entities;
export const connectionsGetter = (state) => state.connections.entities;
export const idGetter = (state, props) => props.id;
export const operationGetter = (state, props) => props.operation;
export const locationStateGetter = (state) => state.router.location.state;
const activeGetter = (state, props) => props.active;
const loadingGetter = (state, props) => props.loading;
const connectedGetter = (state, props) => props.connected;

export const filteredCertificatesSelector = createSelector(certificatesGetter, filtersGetter, operationGetter, locationStateGetter, (certificates, filters, operation, locationState) => {
  const store = locationState ? locationState.store : undefined;
  const { searchValue } = filters;
  const search = searchValue.toLowerCase();
  let сertificatesByOperations = certificates;

  if (store) {
    сertificatesByOperations = сertificatesByOperations.filter((item: trusted.pkistore.PkiItem) => {
      return item.category === store;
    });
  }

  if (operation === "sign") {
    сertificatesByOperations = сertificatesByOperations.filter((item: trusted.pkistore.PkiItem) => {
      return item.category === "MY" && item.key.length > 0;
    });
  } else if (operation === "encrypt") {
    сertificatesByOperations = сertificatesByOperations.filter((item: trusted.pkistore.PkiItem) => {
      return (item.category === "MY" || item.category === "AddressBook");
    });
  } else if (operation === "address_book") {
    сertificatesByOperations = сertificatesByOperations.filter((item: trusted.pkistore.PkiItem) => {
      return (item.category === "AddressBook");
    });
  }

  return сertificatesByOperations.filter((certificate) => {
    try {
      return (
        certificate.hash.toLowerCase().match(search) ||
        certificate.issuerFriendlyName.toLowerCase().match(search) ||
        certificate.subjectFriendlyName.toLowerCase().match(search) ||
        certificate.serial.toLowerCase().match(search) ||
        certificate.notAfter.toString().toLowerCase().match(search) ||
        certificate.notBefore.toString().toLowerCase().match(search) ||
        certificate.organizationName.toLowerCase().match(search) ||
        certificate.signatureAlgorithm.toLowerCase().match(search)
      );
    } catch (e) {
      return true;
    }
  });
});

export const activeFilesSelector = createSelector(filesGetter, activeGetter, (files, active) => {
  return files.filter((file) => {
    return file.active === active;
  });
});

export const filteredFilesSelector = createSelector(filesGetter, filtersGetter, (files, filters) => {
  const { dateFrom, dateTo, filename, sizeFrom, sizeTo, types } = filters.documents;

  return files.filter((file: any) => {
    return file.fullpath.match(filename) &&
      (sizeFrom ? file.filesize >= sizeFrom : true) &&
      (sizeTo ? file.filesize <= sizeTo : true) &&
      (dateFrom ? (new Date(file.mtime)).getTime() >= (new Date(dateFrom)).getTime() : true) &&
      (dateTo ? (new Date(file.mtime)).getTime() <= (new Date(dateTo.setHours(23, 59, 59, 999))).getTime() : true) &&
      (
        types[ENCRYPTED] && file.extension === "enc" ||
        types[SIGNED] && file.extension === "sig" ||
        (
          !types[ENCRYPTED] && !types[SIGNED]
        )
      );
  });
});

export const filteredContainersSelector = createSelector(containersGetter, filtersGetter, (containers, filters) => {
  const { searchValue } = filters;
  const search = searchValue.toLowerCase();
  let containersArr = mapToArr(containers);

  return containersArr.filter((container) => {
    try {
      return (
        container.name.toLowerCase().match(search)
      );
    } catch (e) {
      return true;
    }

  });
});

export const connectionSelector = () => createSelector(connectionsGetter, idGetter, (connections, id) => {
  return connections.getIn(["entities", id]);
});

export const connectedSelector = createSelector(connectionsGetter, connectedGetter, (connections, connected) => {
  return mapToArr(connections).filter((connection) => {
    return connection.connected === connected;
  });
});

export const loadingRemoteFilesSelector = createSelector(remoteFilesGetter, loadingGetter, (files, loading) => {
  return mapToArr(files).filter((file) => {
    return file.loading === loading;
  });
});
