export type BuilderBlock = {
  id: string;
  type: string;
  enabled: boolean;
  order: number;
  props: Record<string, any>;
};

export type BuilderColumn = {
  id: string;
  widths?: {
    desktop?: number;
    tablet?: number;
    mobile?: number;
  };
  verticalAlign?: "start" | "center" | "end" | "stretch";
  widgets?: BuilderBlock[];
};

export type BuilderLocation =
  | { kind: "root"; index: number }
  | {
      kind: "column";
      containerId: string;
      columnId: string;
      index: number;
    };

export type LocatedBuilderBlock = {
  block: BuilderBlock;
  location: BuilderLocation;
};

export function childColumns(block: BuilderBlock): BuilderColumn[] {
  if (block.type !== "container") return [];
  return Array.isArray(block.props?.columns) ? block.props.columns : [];
}

export function childWidgets(block: BuilderBlock): BuilderBlock[] {
  return childColumns(block).flatMap((column) =>
    Array.isArray(column.widgets) ? column.widgets : [],
  );
}

export function normalizeOrders(blocks: BuilderBlock[]): BuilderBlock[] {
  return blocks.map((block, order) => ({
    ...block,
    order,
    props:
      block.type === "container"
        ? {
            ...block.props,
            columns: childColumns(block).map((column) => ({
              ...column,
              widgets: normalizeOrders(
                Array.isArray(column.widgets) ? column.widgets : [],
              ),
            })),
          }
        : block.props,
  }));
}

export function findBlock(
  blocks: BuilderBlock[],
  blockId: string,
): BuilderBlock | null {
  for (const block of blocks) {
    if (block.id === blockId) return block;
    for (const column of childColumns(block)) {
      const found = findBlock(
        Array.isArray(column.widgets) ? column.widgets : [],
        blockId,
      );
      if (found) return found;
    }
  }
  return null;
}

export function findLocatedBlock(
  blocks: BuilderBlock[],
  blockId: string,
): LocatedBuilderBlock | null {
  for (let index = 0; index < blocks.length; index += 1) {
    const block = blocks[index];
    if (block.id === blockId) {
      return { block, location: { kind: "root", index } };
    }

    for (const column of childColumns(block)) {
      const widgets = Array.isArray(column.widgets) ? column.widgets : [];
      for (let widgetIndex = 0; widgetIndex < widgets.length; widgetIndex += 1) {
        const widget = widgets[widgetIndex];
        if (widget.id === blockId) {
          return {
            block: widget,
            location: {
              kind: "column",
              containerId: block.id,
              columnId: column.id,
              index: widgetIndex,
            },
          };
        }
        const nested = findLocatedBlock([widget], blockId);
        if (nested) return nested;
      }
    }
  }
  return null;
}

export function updateBlock(
  blocks: BuilderBlock[],
  blockId: string,
  updater: (block: BuilderBlock) => BuilderBlock,
): BuilderBlock[] {
  return blocks.map((block) => {
    if (block.id === blockId) return updater(block);
    if (block.type !== "container") return block;

    return {
      ...block,
      props: {
        ...block.props,
        columns: childColumns(block).map((column) => ({
          ...column,
          widgets: updateBlock(
            Array.isArray(column.widgets) ? column.widgets : [],
            blockId,
            updater,
          ),
        })),
      },
    };
  });
}

export function updateContainerColumn(
  blocks: BuilderBlock[],
  containerId: string,
  columnId: string,
  updater: (column: BuilderColumn) => BuilderColumn,
): BuilderBlock[] {
  return updateBlock(blocks, containerId, (block) => ({
    ...block,
    props: {
      ...block.props,
      columns: childColumns(block).map((column) =>
        column.id === columnId ? updater(column) : column,
      ),
    },
  }));
}

function extractFromList(
  blocks: BuilderBlock[],
  blockId: string,
): { blocks: BuilderBlock[]; extracted: BuilderBlock | null } {
  const directIndex = blocks.findIndex((block) => block.id === blockId);
  if (directIndex >= 0) {
    const next = [...blocks];
    const [extracted] = next.splice(directIndex, 1);
    return { blocks: normalizeOrders(next), extracted };
  }

  let extracted: BuilderBlock | null = null;
  const next = blocks.map((block) => {
    if (extracted || block.type !== "container") return block;

    const columns = childColumns(block).map((column) => {
      if (extracted) return column;
      const result = extractFromList(
        Array.isArray(column.widgets) ? column.widgets : [],
        blockId,
      );
      if (result.extracted) extracted = result.extracted;
      return { ...column, widgets: result.blocks };
    });

    return {
      ...block,
      props: {
        ...block.props,
        columns,
      },
    };
  });

  return { blocks: normalizeOrders(next), extracted };
}

export function extractBlock(
  blocks: BuilderBlock[],
  blockId: string,
): { blocks: BuilderBlock[]; extracted: BuilderBlock | null } {
  return extractFromList(blocks, blockId);
}

export function removeBlock(
  blocks: BuilderBlock[],
  blockId: string,
): BuilderBlock[] {
  return extractBlock(blocks, blockId).blocks;
}

export function insertIntoRoot(
  blocks: BuilderBlock[],
  block: BuilderBlock,
  index?: number,
): BuilderBlock[] {
  const next = [...blocks];
  const target =
    index === undefined
      ? next.length
      : Math.max(0, Math.min(next.length, Math.trunc(index)));
  next.splice(target, 0, block);
  return normalizeOrders(next);
}

export function insertIntoColumn(
  blocks: BuilderBlock[],
  containerId: string,
  columnId: string,
  block: BuilderBlock,
  index?: number,
): BuilderBlock[] {
  return updateContainerColumn(blocks, containerId, columnId, (column) => {
    const widgets = Array.isArray(column.widgets) ? [...column.widgets] : [];
    const target =
      index === undefined
        ? widgets.length
        : Math.max(0, Math.min(widgets.length, Math.trunc(index)));
    widgets.splice(target, 0, block);
    return { ...column, widgets: normalizeOrders(widgets) };
  });
}

export function moveBlockToColumn(
  blocks: BuilderBlock[],
  blockId: string,
  containerId: string,
  columnId: string,
  index?: number,
): BuilderBlock[] {
  if (blockId === containerId) return blocks;

  const result = extractBlock(blocks, blockId);
  if (!result.extracted) return blocks;

  // Prevent creating a recursive tree by dropping a container into one of its descendants.
  if (
    result.extracted.type === "container" &&
    findBlock([result.extracted], containerId)
  ) {
    return blocks;
  }

  return insertIntoColumn(
    result.blocks,
    containerId,
    columnId,
    result.extracted,
    index,
  );
}

export function moveBlockToRoot(
  blocks: BuilderBlock[],
  blockId: string,
  index?: number,
): BuilderBlock[] {
  const result = extractBlock(blocks, blockId);
  if (!result.extracted) return blocks;
  return insertIntoRoot(result.blocks, result.extracted, index);
}

export function reorderInsideColumn(
  blocks: BuilderBlock[],
  containerId: string,
  columnId: string,
  sourceId: string,
  targetIndex: number,
): BuilderBlock[] {
  const extracted = extractBlock(blocks, sourceId);
  if (!extracted.extracted) return blocks;
  return insertIntoColumn(
    extracted.blocks,
    containerId,
    columnId,
    extracted.extracted,
    targetIndex,
  );
}

export function resizeAdjacentColumns(
  blocks: BuilderBlock[],
  containerId: string,
  leftColumnId: string,
  rightColumnId: string,
  device: "desktop" | "tablet" | "mobile",
  deltaPercent: number,
): BuilderBlock[] {
  return updateBlock(blocks, containerId, (container) => {
    if (container.type !== "container") return container;
    const columns = childColumns(container);
    const left = columns.find((column) => column.id === leftColumnId);
    const right = columns.find((column) => column.id === rightColumnId);
    if (!left || !right) return container;

    const leftWidth = Number(left.widths?.[device] ?? 50);
    const rightWidth = Number(right.widths?.[device] ?? 50);
    const total = Math.max(20, leftWidth + rightWidth);
    const min = Math.min(15, total / 3);
    const nextLeft = Math.min(
      total - min,
      Math.max(min, leftWidth + deltaPercent),
    );
    const nextRight = total - nextLeft;

    return {
      ...container,
      props: {
        ...container.props,
        columns: columns.map((column) => {
          if (column.id === leftColumnId) {
            return {
              ...column,
              widths: {
                ...(column.widths || {}),
                [device]: Math.round(nextLeft * 10) / 10,
              },
            };
          }
          if (column.id === rightColumnId) {
            return {
              ...column,
              widths: {
                ...(column.widths || {}),
                [device]: Math.round(nextRight * 10) / 10,
              },
            };
          }
          return column;
        }),
      },
    };
  });
}

export function cloneBlockDeep(
  block: BuilderBlock,
  makeId: () => string,
): BuilderBlock {
  const nextId = makeId();
  if (block.type !== "container") {
    return {
      ...block,
      id: nextId,
      props: JSON.parse(JSON.stringify(block.props || {})),
    };
  }

  return {
    ...block,
    id: nextId,
    props: {
      ...JSON.parse(JSON.stringify(block.props || {})),
      columns: childColumns(block).map((column) => ({
        ...column,
        id: makeId(),
        widgets: (column.widgets || []).map((widget) =>
          cloneBlockDeep(widget, makeId),
        ),
      })),
    },
  };
}

export function walkBlocks(
  blocks: BuilderBlock[],
  visitor: (block: BuilderBlock, depth: number) => void,
  depth = 0,
) {
  for (const block of blocks) {
    visitor(block, depth);
    for (const column of childColumns(block)) {
      walkBlocks(column.widgets || [], visitor, depth + 1);
    }
  }
}
