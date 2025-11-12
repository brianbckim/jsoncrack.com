import type { DefaultTheme } from "styled-components";
import styled from "styled-components";
import { LinkItUrl } from "react-linkify-it";
import { NODE_DIMENSIONS } from "../../../../../constants/graph";

type TextColorFn = {
  theme: DefaultTheme;
  $type?: string;
  $value?: string | number | null | boolean;
};

function getTextColor({ $value, $type, theme }: TextColorFn) {
  if ($value === null) return theme.NODE_COLORS.NULL;
  if ($type === "object") return theme.NODE_COLORS.NODE_KEY;
  if ($type === "number") return theme.NODE_COLORS.INTEGER;
  if ($value === true) return theme.NODE_COLORS.BOOL.TRUE;
  if ($value === false) return theme.NODE_COLORS.BOOL.FALSE;
  return theme.NODE_COLORS.NODE_VALUE;
}

export const StyledLinkItUrl = styled(LinkItUrl)`
  text-decoration: underline;
  pointer-events: all;
`;

export const StyledForeignObject = styled.foreignObject<{ $isObject?: boolean; $editing?: boolean }>`
  text-align: ${({ $isObject }) => !$isObject && "center"};
  color: ${({ theme }) => theme.NODE_COLORS.TEXT};
  font-family: monospace;
  font-size: ${({ $editing }) => ($editing ? "9px" : "10px")};
  font-weight: 500;
  overflow: ${({ $editing }) => ($editing ? "visible" : "hidden")};
  pointer-events: ${({ $editing }) => ($editing ? "all" : "none")};

  &.searched {
    background: rgba(27, 255, 0, 0.1);
    border: 1px solid ${({ theme }) => theme.TEXT_POSITIVE};
    border-radius: 2px;
    box-sizing: border-box;
  }

  .highlight {
    background: rgba(255, 214, 0, 0.15);
  }

  .renderVisible {
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: inherit;
    width: 100%;
    height: 100%;
    overflow: hidden;
    cursor: pointer;
  }
`;

export const StyledKey = styled.span<{
  $type: TextColorFn["$type"];
  $value?: TextColorFn["$value"];
  $editing?: boolean;
}>`
  display: inline;
  align-items: center;
  justify-content: center;
  flex: 1;
  min-width: 0;
  height: auto;
  line-height: inherit;
  padding: 0; // Remove padding
  font-size: ${({ $editing }) => ($editing ? "9px" : "inherit")};
  color: ${({ theme, $type, $value = "" }) => getTextColor({ $value, $type, theme })};
  overflow: ${({ $editing }) => ($editing ? "visible" : "hidden")};
  text-overflow: ${({ $editing }) => ($editing ? "clip" : "ellipsis")};
  white-space: ${({ $editing }) => ($editing ? "normal" : "nowrap")};
  word-break: break-word;
  max-width: 100%;
`;

export const StyledRow = styled.span<{ $value: TextColorFn["$value"]; $editing?: boolean }>`
  padding: 3px 10px;
  height: ${({ $editing }) => ($editing ? "auto" : `${NODE_DIMENSIONS.ROW_HEIGHT}px`)};
  line-height: ${({ $editing }) => ($editing ? "16px" : "24px")};
  color: ${({ theme, $value }) => getTextColor({ $value, theme, $type: typeof $value })};
  display: block;
  overflow: ${({ $editing }) => ($editing ? "visible" : "hidden")};
  text-overflow: ${({ $editing }) => ($editing ? "clip" : "ellipsis")};
  white-space: ${({ $editing }) => ($editing ? "normal" : "nowrap")};
  min-width: ${({ $editing }) => ($editing ? "160px" : "0")};
  word-break: break-word;
  border-bottom: 1px solid ${({ theme }) => theme.NODE_COLORS.DIVIDER};
  box-sizing: border-box;

  &:last-of-type {
    border-bottom: none;
  }

  .searched & {
    border-bottom: 1px solid ${({ theme }) => theme.TEXT_POSITIVE};
  }
`;

export const StyledChildrenCount = styled.span`
  color: ${({ theme }) => theme.NODE_COLORS.CHILD_COUNT};
  padding: 10px;
  margin-left: -15px;
`;
