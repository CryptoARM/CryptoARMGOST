import { createSelector } from "reselect";
import {
  ALL, ARCHIVED, ENCRYPTED, SIGNED,
} from "../constants";

export const documentsGetter = (state) => state.multiOperations.entities;
export const filtersGetter = (state) => state.filters;

export const filteredOperationsResultsSelector = createSelector(documentsGetter, filtersGetter, (documents, filters) => {
  const { dateFrom, dateTo, filename, sizeFrom, sizeTo, types } = filters.documents;

  return documents.filter((document: any) => {
    return document.fullpath.match(filename) &&
      (sizeFrom ? document.filesize >= sizeFrom : true) &&
      (sizeTo ? document.filesize <= sizeTo : true) &&
      (dateFrom ? (new Date(document.mtime)).getTime() >= (new Date(dateFrom)).getTime() : true) &&
      (dateTo ? (new Date(document.mtime)).getTime() <= (new Date(dateTo.setHours(23, 59, 59, 999))).getTime() : true) &&
      (
        types[ENCRYPTED] && document.extension === "enc" ||
        types[SIGNED] && document.extension === "sig" ||
        types[ARCHIVED] && document.extension === "zip" ||
        (
          !types[ENCRYPTED] && !types[SIGNED] && !types[ARCHIVED]
        )
      );
  });
});

export const stateSelector = (state: any) => state.multiOperations;
export const entitiesSelector = createSelector(stateSelector, (state) => state.entities);
export const selectionSelector = createSelector(stateSelector, (state) => state.selected.toArray());
export const selectedOperationsResultsSelector = createSelector(entitiesSelector, selectionSelector, (entities, selection) =>
  selection.map((uid: any) => entities.get(uid)),
);

export const originalSelector = createSelector(stateSelector, (state) => state.files.map((file: any) => file.original));

export const selectedFiltredResultsSelector = createSelector(
  filteredOperationsResultsSelector, selectionSelector, (filter, selection) =>
  filter.filter((entries: any) => {
    return selection.some((selectionFilter: any) => {
      return entries.id === selectionFilter;
    });
  }));
