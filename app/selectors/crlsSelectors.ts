import { createSelector } from "reselect";
import { mapToArr } from "../utils";

export const crlsGetter = (state: any) => state.crls.entities;
export const filtersGetter = (state: any) => state.filters;

export const filteredCrlsSelector = createSelector(crlsGetter, filtersGetter, (crls, filters) => {
  const { searchValue } = filters;
  const search = searchValue.toLowerCase();
  let arrCrls = crls;

  arrCrls = arrCrls.sort((a, b) => {
    const aCrlIN = a.issuerFriendlyName.toLowerCase();
    const bCrlIN = b.issuerFriendlyName.toLowerCase();

    if (aCrlIN < bCrlIN) {
      return -1;
    }

    if (aCrlIN > bCrlIN) {
      return 1;
    }

    return 0;
  });

  return arrCrls.filter((crl: any) => {
    try {
      return (
        crl.hash.toLowerCase().match(search) ||
        crl.issuerFriendlyName.toLowerCase().match(search) ||
        crl.lastUpdate.toLowerCase().match(search) ||
        crl.nextUpdate.toLowerCase().match(search) ||
        crl.signatureAlgorithm.toLowerCase().match(search)
      );
    } catch (e) {
      return true;
    }
  });
});
