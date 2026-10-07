import { IndividualObject } from "@/states/raw/individual/get-individual-object";

const filterUnusedIndividualObjs = (individualObjs: IndividualObject[]): IndividualObject[] => {
  const cloneIndividualObjs = JSON.parse(JSON.stringify(individualObjs)) as IndividualObject[];
  const individualObjsWithHas = cloneIndividualObjs.filter((i) => i?.has);
  return individualObjsWithHas;
};

const getIndividualObjSortPowerMode = (individualObjs: IndividualObject[], index: number): IndividualObject | undefined => {
  const filteredIndividualObjs = filterUnusedIndividualObjs(individualObjs);
  return filteredIndividualObjs?.[index] ?? undefined;
};

export interface RightColumn {
  top?: IndividualObject;
  mid?: IndividualObject;
  bottom?: IndividualObject;
}

export const getRightColumns = (individualObjs: IndividualObject[]): RightColumn[] => {
  const items = individualObjs.filter((i) => i?.has);
  const rightItems = items.slice(2);
  const columns: RightColumn[] = [];

  if (rightItems.length === 1) {
    columns.push({ top: rightItems[0] });
    return columns;
  }

  let i = 0;
  while (i < rightItems.length) {
    const remaining = rightItems.length - i;
    if (remaining === 1) {
      columns.push({ mid: rightItems[i] });
      i++;
    } else {
      columns.push({
        top: rightItems[i],
        bottom: rightItems[i + 1],
      });
      i += 2;
    }
  }

  return columns;
};

export const getTopLeftIndividual = (individualObjs: IndividualObject[]): IndividualObject | undefined => {
  const items = individualObjs.filter((i) => i?.has);
  return items[0];
};

export const getBottomLeftIndividual = (individualObjs: IndividualObject[]): IndividualObject | undefined => {
  const items = individualObjs.filter((i) => i?.has);
  return items[1];
};

export const getTopRightIndividual = (individualObjs: IndividualObject[]): IndividualObject | undefined => {
  return getRightColumns(individualObjs)[0]?.top;
};

export const getBottomRightIndividual = (individualObjs: IndividualObject[]): IndividualObject | undefined => {
  return getRightColumns(individualObjs)[0]?.bottom;
};

export const getMidRightIndividual = (individualObjs: IndividualObject[]): IndividualObject | undefined => {
  return getRightColumns(individualObjs).find((c) => !!c.mid)?.mid;
};

export const checkHasRightIndividual = (individualObjs: IndividualObject[]): boolean =>
  getRightColumns(individualObjs).length > 0;

export const checkHasBottomIndividual = (individualObjs: IndividualObject[]): boolean =>
  !!getBottomLeftIndividual(individualObjs) || getRightColumns(individualObjs).some((c) => !!c.bottom);

export const checkHasMiddleIndividual = (individualObjs: IndividualObject[]): boolean =>
  getRightColumns(individualObjs).some((c) => !!c.mid);
