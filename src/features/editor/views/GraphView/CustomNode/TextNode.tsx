import React, { useEffect, useMemo, useRef, useState } from "react";
import styled from "styled-components";
import type { CustomNodeProps } from ".";
import useConfig from "../../../../../store/useConfig";
import { coercePrimitive, updateJsonAtPath } from "../lib/utils/inlineEdit";
import { isContentImage } from "../lib/utils/calculateNodeSize";
import { TextRenderer } from "./TextRenderer";
import * as Styled from "./styles";

const StyledTextNodeWrapper = styled.span<{ $isParent: boolean; $editing?: boolean }>`
  display: flex;
  justify-content: ${({ $isParent }) => ($isParent ? "center" : "flex-start")};
  align-items: center;
  height: 100%;
  width: 100%;
  overflow: ${({ $editing }) => ($editing ? "visible" : "hidden")};
  padding: 0 10px;
  /* Enable interaction inside foreignObject */
  pointer-events: all;
  text-overflow: ${({ $editing }) => ($editing ? "clip" : "ellipsis")};
  white-space: ${({ $editing }) => ($editing ? "normal" : "nowrap")};
  flex-wrap: ${({ $editing }) => ($editing ? "wrap" : "nowrap")};
  min-width: ${({ $editing }) => ($editing ? "140px" : "0")};
`;

const StyledImageWrapper = styled.div`
  padding: 5px;
`;

const StyledImage = styled.img`
  border-radius: 2px;
  object-fit: contain;
  background: ${({ theme }) => theme.BACKGROUND_MODIFIER_ACCENT};
`;

const Node = ({ node, x, y }: CustomNodeProps) => {
  const { text, width, height } = node;
  const imagePreviewEnabled = useConfig(state => state.imagePreviewEnabled);
  const isImage = imagePreviewEnabled && isContentImage(JSON.stringify(text[0].value));
  const value = text[0].value;
  const valueType = text[0].type;

  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState<string>(() => (value === null ? "null" : String(value)));
  const [invalid, setInvalid] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const canEdit = useMemo(() => {
    // Only allow inline edit for primitive leaf nodes
    return ["string", "number", "boolean", "null"].includes(valueType as string);
  }, [valueType]);

  

  const commitSave = () => {
    const result = coercePrimitive(valueType as string, draft);
    if (!result.ok) {
      setInvalid(result.error || "Invalid value");
      return;
    }
    try {
      // For leaf nodes, we can use the node's own path directly
      const ok = updateJsonAtPath(node.path as any[], result.value);
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
    setDraft(value === null ? "null" : String(value));
    setInvalid(null);
    setIsEditing(false);
  };

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  return (
    <Styled.StyledForeignObject
      data-id={`node-${node.id}`}
      width={width}
      height={height}
      x={0}
      y={0}
      $editing={isEditing}
    >
      {isImage ? (
        <StyledImageWrapper>
          <StyledImage src={JSON.stringify(text[0].value)} width="70" height="70" loading="lazy" />
        </StyledImageWrapper>
      ) : (
        <StyledTextNodeWrapper
          data-x={x}
          data-y={y}
          data-key={JSON.stringify(text)}
          $isParent={false}
          $editing={isEditing}
        >
          {!isEditing && (
            <Styled.StyledKey $value={value} $type={typeof text[0].value} $editing={isEditing}>
              <TextRenderer editing={isEditing}>{value}</TextRenderer>
            </Styled.StyledKey>
          )}
          {isEditing && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, minWidth: 0 }}>
              <input
                style={{
                  fontFamily: "monospace",
                  fontSize: 10,
                  padding: "1px 4px",
                  width: 100,
                }}
                ref={inputRef}
                value={draft}
                onClick={e => e.stopPropagation()}
                onChange={e => setDraft(e.target.value)}
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
              <button type="button" onClick={onSave} style={{ fontSize: 10, padding: "1px 4px" }} aria-label="Save value">
                Save
              </button>
              <button type="button" onClick={onCancel} style={{ fontSize: 10, padding: "1px 4px" }} aria-label="Cancel editing">
                Cancel
              </button>
            </span>
          )}
          {canEdit && !isEditing && (
            <button
              onClick={e => {
                e.stopPropagation();
                setDraft(value === null ? "null" : String(value));
                setIsEditing(true);
              }}
              style={{ marginLeft: 8, fontSize: 10, padding: "1px 4px" }}
              aria-label="Edit value"
              type="button"
            >
              Edit
            </button>
          )}
          {invalid && isEditing && (
            <span style={{ color: "#ff6b6b", marginLeft: 6, fontSize: 11 }}>{invalid}</span>
          )}
        </StyledTextNodeWrapper>
      )}
    </Styled.StyledForeignObject>
  );
};

function propsAreEqual(prev: CustomNodeProps, next: CustomNodeProps) {
  return prev.node.text === next.node.text && prev.node.width === next.node.width;
}

export const TextNode = React.memo(Node, propsAreEqual);
