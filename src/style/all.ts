import { PowerFlowCardPlus } from "@/power-flow-card-plus";
import { ConfigEntities } from "@/power-flow-card-plus-config";
import { IndividualObject } from "@/states/raw/individual/get-individual-object";
import { IndividualDeviceType } from "@/type";
import { convertColorListToHex } from "@/utils/convert-color";
import { computeColor } from "./colors";

interface AllDynamicStyles {
  individual: IndividualObject[];
  entities: ConfigEntities;
  [key: string]: any;
}

export const allDynamicStyles = (
  main: PowerFlowCardPlus,
  {
    grid,
    solar,
    entities,
    individual,
    battery,
    homeSources,
    homeLargestSource,
    nonFossil,
    display_zero_lines_transparency,
    display_zero_lines_grey_color,
    isCardWideEnough,
  }: AllDynamicStyles
) => {
  // Grid
  main.style.setProperty(
    "--icon-grid-color",
    grid.color.icon_type === "consumption"
      ? "var(--energy-grid-consumption-color)"
      : grid.color.icon_type === "production"
        ? "var(--energy-grid-return-color)"
        : grid.color.icon_type === "color_dynamically"
          ? (grid.state.fromGrid ?? 0) >= (grid.state.toGrid ?? 0)
            ? "var(--energy-grid-consumption-color)"
            : "var(--energy-grid-return-color)"
          : "var(--primary-text-color)"
  );

  main.style.setProperty(
    "--circle-grid-color",
    grid.color.circle_type === "consumption"
      ? "var(--energy-grid-consumption-color)"
      : grid.color.circle_type === "production"
        ? "var(--energy-grid-return-color)"
        : grid.color.circle_type === "color_dynamically"
          ? (grid.state.fromGrid ?? 0) >= (grid.state.toGrid ?? 0)
            ? "var(--energy-grid-consumption-color)"
            : "var(--energy-grid-return-color)"
          : "var(--energy-grid-consumption-color)"
  );

  if (grid.color.fromGrid !== undefined) {
    if (typeof grid.color.fromGrid === "object") {
      grid.color.fromGrid = convertColorListToHex(grid.color.fromGrid);
    }
    main.style.setProperty("--energy-grid-consumption-color", grid.color.fromGrid || "#a280db");
  }

  if (grid.color.toGrid !== undefined) {
    if (typeof grid.color.toGrid === "object") {
      grid.color.toGrid = convertColorListToHex(grid.color.toGrid);
    }
    main.style.setProperty("--energy-grid-return-color", grid.color.toGrid || "#a280db");
  }

  main.style.setProperty(
    "--secondary-text-grid-color",
    grid.secondary.color.type === "consumption"
      ? "var(--energy-grid-consumption-color)"
      : grid.secondary.color.type === "production"
        ? "var(--energy-grid-return-color)"
        : grid.secondary.color.type === true
          ? (grid.state.fromGrid ?? 0) >= (grid.state.toGrid ?? 0)
            ? "var(--energy-grid-consumption-color)"
            : "var(--energy-grid-return-color)"
          : "var(--primary-text-color)"
  );

  if (entities.grid?.color_value === false) {
    main.style.setProperty("--text-grid-consumption-color", "var(--primary-text-color)");
    main.style.setProperty("--text-grid-return-color", "var(--primary-text-color)");
  } else {
    main.style.setProperty("--text-grid-consumption-color", "var(--energy-grid-consumption-color)");
    main.style.setProperty("--text-grid-return-color", "var(--energy-grid-return-color)");
  }

  // Solar
  main.style.setProperty("--text-solar-color", entities.solar?.color_value ? "var(--energy-solar-color)" : "var(--primary-text-color)");

  main.style.setProperty(
    "--secondary-text-solar-color",
    entities.solar?.secondary_info?.color_value ? "var(--energy-solar-color)" : "var(--primary-text-color)"
  );

  if (entities.solar?.color !== undefined) {
    let solarColor = entities.solar?.color;
    if (typeof solarColor === "object") solarColor = convertColorListToHex(solarColor);
    main.style.setProperty("--energy-solar-color", solarColor || "#ff9800");
  }
  main.style.setProperty("--icon-solar-color", entities.solar?.color_icon ? "var(--energy-solar-color)" : "var(--primary-text-color)");

  // Battery
  if (battery.color.fromBattery !== undefined) {
    if (typeof battery.color.fromBattery === "object") battery.color.fromBattery = convertColorListToHex(battery.color.fromBattery);
    main.style.setProperty("--energy-battery-out-color", battery.color.fromBattery || "#4db6ac");
  }
  if (battery.color.toBattery !== undefined) {
    if (typeof battery.color.toBattery === "object") battery.color.toBattery = convertColorListToHex(battery.color.toBattery);
    main.style.setProperty("--energy-battery-in-color", battery.color.toBattery || "#a280db");
  }
  battery.color.icon_type = entities.battery?.color_icon;
  main.style.setProperty(
    "--icon-battery-color",
    battery.color.icon_type === "consumption"
      ? "var(--energy-battery-in-color)"
      : battery.color.icon_type === "production"
        ? "var(--energy-battery-out-color)"
        : battery.color.icon_type === "color_dynamically"
          ? battery.state.fromBattery >= battery.state.toBattery
            ? "var(--energy-battery-out-color)"
            : "var(--energy-battery-in-color)"
          : "var(--primary-text-color)"
  );
  const batteryStateOfChargeColorType = entities.battery?.color_state_of_charge_value;
  main.style.setProperty(
    "--text-battery-state-of-charge-color",
    batteryStateOfChargeColorType === "consumption"
      ? "var(--energy-battery-in-color)"
      : batteryStateOfChargeColorType === "production"
        ? "var(--energy-battery-out-color)"
        : batteryStateOfChargeColorType === "color_dynamically"
          ? battery.state.fromBattery >= battery.state.toBattery
            ? "var(--energy-battery-out-color)"
            : "var(--energy-battery-in-color)"
          : "var(--primary-text-color)"
  );
  main.style.setProperty(
    "--circle-battery-color",
    battery.color.circle_type === "consumption"
      ? "var(--energy-battery-in-color)"
      : battery.color.circle_type === "production"
        ? "var(--energy-battery-out-color)"
        : battery.color.circle_type === "color_dynamically"
          ? battery.state.fromBattery >= battery.state.toBattery
            ? "var(--energy-battery-out-color)"
            : "var(--energy-battery-in-color)"
          : "var(--energy-battery-in-color)"
  );
  if (entities.battery?.color_value === false) {
    main.style.setProperty("--text-battery-in-color", "var(--primary-text-color)");
    main.style.setProperty("--text-battery-out-color", "var(--primary-text-color)");
  } else {
    main.style.setProperty("--text-battery-in-color", "var(--energy-battery-in-color)");
    main.style.setProperty("--text-battery-out-color", "var(--energy-battery-out-color)");
  }

  // Non-fossil
  if (nonFossil.color !== undefined) {
    if (typeof nonFossil.color === "object") nonFossil.color = convertColorListToHex(nonFossil.color);
    main.style.setProperty("--non-fossil-color", nonFossil.color || "var(--energy-non-fossil-color)");
  }
  main.style.setProperty(
    "--icon-non-fossil-color",
    entities.fossil_fuel_percentage?.color_icon ? "var(--non-fossil-color)" : "var(--primary-text-color)"
  );
  main.style.setProperty(
    "--text-non-fossil-color",
    entities.fossil_fuel_percentage?.color_value ? "var(--non-fossil-color)" : "var(--primary-text-color)"
  );
  main.style.setProperty(
    "--secondary-text-non-fossil-color",
    entities.fossil_fuel_percentage?.secondary_info?.color_value ? "var(--non-fossil-color)" : "var(--primary-text-color)"
  );

  // Home
  main.style.setProperty(
    "--secondary-text-home-color",
    entities.home?.secondary_info?.color_value ? "var(--text-home-color)" : "var(--primary-text-color)"
  );
  main.style.setProperty("--icon-home-color", computeColor(entities.home?.color_icon, homeSources, homeLargestSource));
  main.style.setProperty("--text-home-color", computeColor(entities.home?.color_value, homeSources, homeLargestSource));

  // --home-circle-animation
  if (entities.home?.circle_animation === false) main.style.setProperty("--home-circle-animation", "none");

  //   Battery-Grid line
  main.style.setProperty(
    "--battery-grid-line",
    grid.state.toBattery || 0 > 0 ? "var(--energy-grid-consumption-color)" : "var(--energy-grid-return-color)"
  );

  // Transparencies
  main.style.setProperty("--transparency-unused-lines", display_zero_lines_transparency ? display_zero_lines_transparency.toString() : "0");

  if (display_zero_lines_grey_color !== undefined) {
    let greyColor = display_zero_lines_grey_color;
    if (typeof greyColor === "object") greyColor = convertColorListToHex(greyColor);
    main.style.setProperty("--greyed-out--line-color", greyColor);
  }

  if (solar.has) {
    if (battery.has) {
      // has solar, battery and grid
      // main.style.setProperty("--lines-svg-not-flat-line-height", isCardWideEnough ? "106%" : "102%");
      main.style.setProperty("--lines-svg-not-flat-line-height", "106%");
      // main.style.setProperty("--lines-svg-not-flat-line-top", isCardWideEnough ? "-3%" : "-1%");
      main.style.setProperty("--lines-svg-not-flat-line-top", "-3%");
      main.style.setProperty("--lines-svg-flat-width", isCardWideEnough ? "calc(100% - 160px)" : "calc(100% - 160px)");
      main.style.setProperty("--lines-svg-flat-left", "0");
      main.style.setProperty("--lines-svg-not-flat-left", "0");
    } else {
      // has solar but no battery
      // main.style.setProperty("--lines-svg-not-flat-line-height", isCardWideEnough ? "104%" : "102%");
      // main.style.setProperty("--lines-svg-not-flat-line-top", isCardWideEnough ? "-2%" : "-1%");
      main.style.setProperty("--lines-svg-not-flat-line-top", "-2%");
      main.style.setProperty("--lines-svg-flat-width", isCardWideEnough ? "calc(100% - 154px)" : "calc(100% - 157px)");
      main.style.setProperty("--lines-svg-not-flat-width", isCardWideEnough ? "calc(103% - 172px)" : "calc(103% - 169px)");
      main.style.setProperty("--lines-svg-not-flat-left", "3px");
      main.style.setProperty("--lines-svg-flat-left", "-3px");
    }
  }

  if (individual?.some((ind) => ind.has)) {
    const colors = [
      "#d0cc5b", // 0: left-top
      "#964cb5", // 1: left-bottom
      "#b54c9d", // 2: right-top-1
      "#5bd0cc", // 3: right-bottom-1
      "#ff9800", // 4: right-mid-1 / right-top-2
      "#e91e63", // 5: right-bottom-2
      "#00bcd4", // 6: right-top-3 / right-mid-2
      "#4caf50", // 7: right-bottom-3
      "#9c27b0", // 8: right-top-4 / right-mid-3
      "#ff5722", // 9: right-bottom-4
    ];
    const fieldNames: string[] = [
      "left-top",
      "left-bottom",
      "right-top",
      "right-bottom",
      "right-mid",
      "right-top-2",
      "right-bottom-2",
      "right-mid-2",
      "right-top-3",
      "right-bottom-3",
    ];

    const getStylesForIndividual = (indObj: IndividualObject, index: number) => {
      const field = indObj.field;
      const fieldName = fieldNames?.[index] || `item-${index}`;

      let individualColor = field?.color || indObj.color;
      if (typeof individualColor === "object") individualColor = convertColorListToHex(individualColor);
      const chosenColor = individualColor || colors[index % colors.length] || "#d0cc5b";

      main.style.setProperty(`--individual-${fieldName}-color`, chosenColor);
      main.style.setProperty(`--individual-${index}-color`, chosenColor);

      main.style.setProperty(
        `--icon-individual-${fieldName}-color`,
        field?.color_icon !== false ? `var(--individual-${fieldName}-color)` : `var(--primary-text-color)`
      );
      main.style.setProperty(
        `--text-individual-${fieldName}-color`,
        field?.color_value ? `var(--individual-${fieldName}-color)` : `var(--primary-text-color)`
      );
      main.style.setProperty(
        `--secondary-text-individual-${fieldName}-color`,
        field?.secondary_info?.color_value ? `var(--individual-${fieldName}-color)` : `var(--primary-text-color)`
      );

      // Handle children colors if present
      if (indObj.children && indObj.children.length > 0) {
        indObj.children.forEach((child, cIdx) => {
          let childColor = child.field?.color || child.color;
          if (typeof childColor === "object") childColor = convertColorListToHex(childColor);
          const finalChildColor = childColor || chosenColor;
          main.style.setProperty(`--individual-${index}-child-${cIdx}-color`, finalChildColor);
        });
      }
    };
    const individualsShown = individual.filter((i) => i?.has);
    for (let index = 0; index < (individualsShown.length < 10 ? individualsShown.length : 10); index++) {
      getStylesForIndividual(individualsShown[index], index);
    }
  }
};
