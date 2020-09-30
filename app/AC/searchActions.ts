import { CHANGE_SEARCH_VALUE, REMOVE_SEARCH_VALUE } from "../constants";
import store from "../store"

export function changeSearchValue(searchValue: string) {
  return {
    payload: { searchValue },
    type: CHANGE_SEARCH_VALUE,
  };
}

export function removeSearchValue() {
  store.dispatch({
    type: REMOVE_SEARCH_VALUE,
  });
}
