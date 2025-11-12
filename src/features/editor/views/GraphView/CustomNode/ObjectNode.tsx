import React, { useEffect, useRef, useState } from "react";
import type { CustomNodeProps } from ".";
import { NODE_DIMENSIONS } from "../../../../../constants/graph";
import type { NodeData } from "../../../../../types/graph";
import { TextRenderer } from "./TextRenderer";
import * as Styled from "./styles";
import { coercePrimitive, composeChildPath, updateJsonAtPath } from "../lib/utils/inlineEdit";

type RowProps = {
  row: NodeData["text"][number];
  x: number;
  y: number;
  index: number;
  nodePath?: NodeData["path"];
};

const Row = ({ row, x, y, index, nodePath }: RowProps) => {
  const rowPosition = index * NODE_DIMENSIONS.ROW_HEIGHT;

  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(() => (row.value === null ? "null" : String(row.value)));
  const [invalid, setInvalid] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const isPrimitive = !["object", "array"].includes(row.type);

  const commitSave = () => {
    const result = coercePrimitive(row.type as string, draft);
    if (!result.ok) {
      setInvalid(result.error || "Invalid value");
      return;
    }
    try {
      const composedPath = composeChildPath(nodePath as any[], { key: row.key, type: row.type }, index);
      if (!composedPath) {
        setInvalid("Failed to update JSON");
        return;
      }
      const ok = updateJsonAtPath(composedPath as any[], result.value);
      if (!ok) {
        setInvalid("Failed to update JSON");
        return;
      }
      setIsEditing(false);
      setInvalid(null);
    } catch (err) {
      setInvalid("Failed to update JSON");
    }
  };
  const onSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    commitSave();
  };

  const onCancel = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation();
    setDraft(row.value === null ? "null" : String(row.value));
    setInvalid(null);
    setIsEditing(false);
  };

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const getRowText = () => {
    if (row.type === "object") return `{${row.childrenCount ?? 0} keys}`;
    if (row.type === "array") return `[${row.childrenCount ?? 0} items]`;
    return row.value;
  };

  return (
    <Styled.StyledRow
      $value={row.value}
      data-key={`${row.key}: ${row.value}`}
      data-x={x}
      data-y={y + rowPosition}
      $editing={isEditing}
      style={{ pointerEvents: "all" }}
    >
  <Styled.StyledKey $type="object" $editing={isEditing}>{row.key}: </Styled.StyledKey>
  {!isEditing && <TextRenderer editing={isEditing}>{getRowText()}</TextRenderer>}
      {isEditing && isPrimitive && (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, marginLeft: 4 }}>
          <input
            style={{ fontFamily: "monospace", fontSize: 12, padding: "2px 4px", width: 90 }}
            value={draft}
            onClick={e => e.stopPropagation()}
            onChange={e => setDraft(e.target.value)}
            ref={inputRef}
            onKeyDown={e => {
              if (e.key === "Enter") {
                e.preventDefault();
                commitSave();
              } else if (e.key === "Escape") {
                onCancel(e);
              }
            }}
            aria-label="Edit value input"
          />
          <button type="button" onClick={onSave} style={{ fontSize: 10, padding: "1px 4px" }} aria-label="Save value">Save</button>
          <button type="button" onClick={onCancel} style={{ fontSize: 10, padding: "1px 4px" }} aria-label="Cancel editing">Cancel</button>
        </span>
      )}
      {isPrimitive && !isEditing && (
        <button
          onClick={e => {
            e.stopPropagation();
            setDraft(row.value === null ? "null" : String(row.value));
            setIsEditing(true);
          }}
          style={{ marginLeft: 6, fontSize: 10, padding: "1px 4px" }}
          aria-label="Edit value"
          type="button"
        >
          Edit
        </button>
      )}
      {invalid && isEditing && (
        <span style={{ color: "#ff6b6b", marginLeft: 6, fontSize: 11 }}>{invalid}</span>
      )}
    </Styled.StyledRow>
  );
};

const Node = ({ node, x, y }: CustomNodeProps) => (
  <Styled.StyledForeignObject
    data-id={`node-${node.id}`}
    width={node.width}
    height={node.height}
    x={0}
    y={0}
    $isObject
    $editing={false}
  >
    {node.text.map((row, index) => (
      <Row key={`${node.id}-${index}`} row={row} x={x} y={y} index={index} nodePath={node.path} />
    ))}
  </Styled.StyledForeignObject>
);

function propsAreEqual(prev: CustomNodeProps, next: CustomNodeProps) {
  return (
    JSON.stringify(prev.node.text) === JSON.stringify(next.node.text) &&
    prev.node.width === next.node.width
  );
}

export const ObjectNode = React.memo(Node, propsAreEqual);
