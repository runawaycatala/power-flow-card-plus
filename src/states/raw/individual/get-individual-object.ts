import { ActionConfig, HomeAssistant } from "custom-card-helpers";
import { IndividualDeviceType } from "@/type";
import { computeFieldIcon, computeFieldName } from "@/utils/compute-field-attributes";
import { getIndividualSecondaryState, getIndividualState } from ".";
import { hasIndividualObject } from "./has-individual-object";
import { convertColorListToHex } from "@/utils/convert-color";

const fallbackIndividualObject: IndividualObject = {
  field: undefined,
  entity: "",
  has: false,
  state: null,
  displayZero: false,
  displayZeroTolerance: 0,
  icon: "",
  name: "",
  color: null,
  unit: undefined,
  unit_white_space: false,
  invertAnimation: false,
  showDirection: false,
  secondary: {
    entity: null,
    template: null,
    has: false,
    state: null,
    icon: null,
    unit: null,
    unit_white_space: false,
    displayZero: false,
    accept_negative: false,
    displayZeroTolerance: 0,
    decimals: null,
  },
};

export type IndividualObject = {
  field: IndividualDeviceType | undefined;
  entity: string;
  has: boolean;
  state: number | null;
  displayZero: boolean;
  displayZeroTolerance: number;
  icon: string;
  name: string;
  color: any;
  unit?: string;
  unit_white_space: boolean;
  decimals?: number;
  invertAnimation: boolean;
  showDirection: boolean;
  secondary: {
    entity: string | null;
    template: string | null;
    has: boolean;
    state: string | number | null;
    icon: string | null;
    unit: string | null;
    unit_white_space: boolean;
    displayZero: boolean;
    accept_negative: boolean;
    displayZeroTolerance: number;
    decimals: number | null;
    tap_action?: ActionConfig;
    hold_action?: ActionConfig;
    double_tap_action?: ActionConfig;
  };
  children?: IndividualObject[];
};

export const getIndividualObject = (hass: HomeAssistant, field: IndividualDeviceType | undefined): IndividualObject => {
  if (!field) return fallbackIndividualObject;
  if (!field.entity && (!field.children || field.children.length === 0)) return fallbackIndividualObject;

  const childrenObjs: IndividualObject[] = field.children && field.children.length > 0
    ? field.children.map((child) => getIndividualObject(hass, child))
    : [];

  const entity = field.entity || field.name || "individual_group";
  let state = field.entity ? getIndividualState(hass, field) : null;
  if (childrenObjs.length > 0) {
    state = childrenObjs.reduce((acc, c) => acc + (c.state || 0), 0);
  }

  const displayZero = field?.display_zero || false;
  const displayZeroTolerance = field?.display_zero_tolerance || 0;
  const has = hasIndividualObject(displayZero, state, displayZeroTolerance) || childrenObjs.some((c) => c.has);
  const isStateNegative = state && state < 0;
  const userConfiguredInvertAnimation = field?.inverted_animation || false;
  const invertAnimation = isStateNegative ? !userConfiguredInvertAnimation : userConfiguredInvertAnimation;

  let color: string | null = null;
  if (field?.color && typeof field?.color === "string") {
    color = field.color;
  } else if (field?.color && typeof field?.color === "object") {
    color = convertColorListToHex(field.color);
  }

  return {
    field,
    entity,
    has,
    children: childrenObjs,
    state,
    displayZero,
    displayZeroTolerance,
    icon: computeFieldIcon(hass, field, "mdi:flash"),
    name: computeFieldName(hass, field, "Individual"),
    color,
    unit: field?.unit_of_measurement,
    unit_white_space: field?.unit_white_space !== false,
    decimals: field?.decimals,
    invertAnimation,
    showDirection: field?.show_direction || false,
    secondary: {
      entity: field?.secondary_info?.entity || null,
      template: field?.secondary_info?.template || null,
      has: field?.secondary_info?.entity !== undefined,
      state: getIndividualSecondaryState(hass, field) || null,
      accept_negative: field?.secondary_info?.accept_negative || false,
      icon: field?.secondary_info?.icon || null,
      unit: field?.secondary_info?.unit_of_measurement || null,
      unit_white_space: field?.secondary_info?.unit_white_space !== false,
      displayZero: field?.secondary_info?.display_zero || false,
      displayZeroTolerance: field?.secondary_info?.display_zero_tolerance || 0,
      decimals: field?.secondary_info?.decimals || null,
      tap_action: field?.secondary_info?.tap_action,
      hold_action: field?.secondary_info?.hold_action,
      double_tap_action: field?.secondary_info?.double_tap_action,
    },
  };
};
