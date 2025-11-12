import useJson from "../../../../../../store/useJson";
import useFile from "../../../../../../store/useFile";
import type { NodeRow } from "../../../../../../types/graph";

const DEBUG = false;

// Coerce draft string into original primitive type (does NOT mutate state). On invalid, returns {ok:false,error}.
export function coercePrimitive(originalType: string, input: string) {
  const trimmed = input.trim();
  switch (originalType) {
    case "number": {
      if (trimmed.length === 0) return { ok: false as const, error: "Number required" };
      const n = Number(trimmed);
      if (Number.isFinite(n)) return { ok: true as const, value: n };
      return { ok: false as const, error: "Invalid number" };
    }
    case "boolean": {
      if (/^true$/i.test(trimmed)) return { ok: true as const, value: true };
      if (/^false$/i.test(trimmed)) return { ok: true as const, value: false };
      return { ok: false as const, error: "Use true or false" };
    }
    case "null": {
      if (/^null$/i.test(trimmed) || trimmed === "") return { ok: true as const, value: null };
      return { ok: false as const, error: "Use null" };
    }
    case "string":
    default:
      return { ok: true as const, value: input };
  }
}

// Build child path safely: object child => parentPath + key, array item => parentPath + index.
// Returns null if unable to compose (avoid root replacement) or if parentPath missing.
export function composeChildPath(
  parentPath: (string | number)[] | undefined,
  row: Pick<NodeRow, "key" | "type">,
  index: number,
  explicitIndex?: number
): (string | number)[] | null {
  if (!parentPath || parentPath.length === 0) return null; // do not replace root silently

  if (row.key !== null) return [...parentPath, row.key];

  const seg = typeof explicitIndex === "number" ? explicitIndex : index;
  if (Number.isInteger(seg)) return [...parentPath, seg];

  return null;
}

// Mutate JSON object at jsonPath (array of segments) and persist via store; no root replacement.
interface UpdateOptions {
  reason?: string;
}

export function updateJsonAtPath(path: any[] | null | undefined, newValue: any, options?: UpdateOptions): boolean {
  if (DEBUG) console.debug("[inlineEdit] path", path);
  if (!path || path.length === 0) return false; // never replace root silently

  const getJson = useJson.getState().getJson;
  const setJson = useJson.getState().setJson;
  const current = getJson();
  let parsed: any;
  try {
    parsed = JSON.parse(current);
  } catch {
    return false; // invalid JSON state, abort
  }

  let target = parsed;
  for (let i = 0; i < path.length - 1; i++) {
    const seg = path[i];
    if (target == null) return false; // abort on broken path
    target = target[seg];
  }
  const last = path[path.length - 1];
  if (target && typeof target === "object") {
    target[last] = newValue;
    const s = JSON.stringify(parsed, null, 2);
    setJson(s);
    try {
      // Mirror TextEditor usage shape: setContents({ contents, skipUpdate: true }) plus marking changes
      useFile.getState().setContents({ contents: s, hasChanges: true, skipUpdate: true });
    } catch {}
    if (options?.reason === "inlineEdit") {
      // signal graph to skip auto-fit once
      try {
        const useGraph = require("../../stores/useGraph").default; // dynamic import to avoid circular
        useGraph.setState({ skipAutoFitOnce: true });
      } catch {}
    }
    return true;
  }
  return false;
}
