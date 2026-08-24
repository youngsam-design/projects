import { useCallback, useReducer } from "react";

const historyLimit = 50;

export function documentHistoryReducer(state, action) {
  if (action.type === "initialize") {
    return { past: [], present: action.document, future: [], lastChange: null };
  }
  if (action.type === "replace") {
    return {
      ...state,
      past: action.clearHistory ? [] : state.past,
      present: action.document,
      future: action.clearHistory ? [] : state.future,
      lastChange: null,
    };
  }
  if (action.type === "change" && state.present) {
    const next = action.update(state.present);
    const coalesced =
      action.historyKey &&
      state.lastChange?.key === action.historyKey &&
      action.timestamp - state.lastChange.timestamp < 750;
    return {
      past: coalesced
        ? state.past
        : [...state.past, state.present].slice(-historyLimit),
      present: next,
      future: [],
      lastChange: action.historyKey
        ? { key: action.historyKey, timestamp: action.timestamp }
        : null,
    };
  }
  if (action.type === "undo" && state.past.length) {
    return {
      past: state.past.slice(0, -1),
      present: { ...state.past.at(-1), version: state.present.version },
      future: [state.present, ...state.future],
      lastChange: null,
    };
  }
  if (action.type === "redo" && state.future.length) {
    return {
      past: [...state.past, state.present].slice(-historyLimit),
      present: { ...state.future[0], version: state.present.version },
      future: state.future.slice(1),
      lastChange: null,
    };
  }
  return state;
}

export default function useDocumentHistory() {
  const [state, dispatch] = useReducer(documentHistoryReducer, {
    past: [],
    present: null,
    future: [],
    lastChange: null,
  });

  const initialize = useCallback(
    (document) => dispatch({ type: "initialize", document }),
    [],
  );
  const replace = useCallback(
    (document, { clearHistory = false } = {}) =>
      dispatch({ type: "replace", document, clearHistory }),
    [],
  );
  const change = useCallback(
    (update, historyKey = null) =>
      dispatch({
        type: "change",
        update,
        historyKey,
        timestamp: Date.now(),
      }),
    [],
  );
  const undo = useCallback(() => dispatch({ type: "undo" }), []);
  const redo = useCallback(() => dispatch({ type: "redo" }), []);

  return {
    document: state.present,
    canUndo: state.past.length > 0,
    canRedo: state.future.length > 0,
    initialize,
    replace,
    change,
    undo,
    redo,
  };
}
