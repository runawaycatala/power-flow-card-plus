import { html, nothing, svg, TemplateResult } from "lit";
import { individualSecondarySpan } from "./spans/individual-secondary-span";
import { NewDur, TemplatesObj } from "@/type";
import { PowerFlowCardPlusConfig } from "@/power-flow-card-plus-config";
import { computeFlowRate, computeIndividualFlowRate } from "@/utils/compute-flow-rate";
import { showLine } from "@/utils/show-line";
import { IndividualObject } from "@/states/raw/individual/get-individual-object";
import { PowerFlowCardPlus } from "@/power-flow-card-plus";
import { styleLine } from "@/utils/style-line";
import { checkShouldShowDots } from "@/utils/check-should-show-dots";
import { displayValue } from "@/utils/display-value";

export type IndividualPosition = "left-top" | "left-bottom" | "right-top" | "right-bottom" | "right-mid";

interface IndividualRenderProps {
  individualObj?: IndividualObject;
  position: IndividualPosition;
  colIndex?: number;
  newDur: NewDur;
  templatesObj: TemplatesObj;
  battery?: any;
  hasBottomRow?: boolean;
}

export const renderIndividualElement = (
  main: PowerFlowCardPlus,
  config: PowerFlowCardPlusConfig,
  { individualObj, position, colIndex = 0, newDur, templatesObj, hasBottomRow = false }: IndividualRenderProps
): TemplateResult => {
  if (!individualObj) return html`<div class="spacer"></div>`;

  const disableEntityClick = config.clickable_entities === false;
  const indexOfIndividual = config?.entities?.individual?.findIndex((e) => e.entity === individualObj.entity || e.name === individualObj.name) ?? 0;
  const safeIndex = indexOfIndividual >= 0 ? indexOfIndividual : 0;
  const duration = newDur.individual[safeIndex] || 1.66;

  const displayState = displayValue(main.hass, config, individualObj.state, {
    decimals: individualObj.decimals,
    unit: individualObj.unit,
    unitWhiteSpace: individualObj.unit_white_space,
    watt_threshold: config.watt_threshold,
  });

  const hasChildren = !!(individualObj.children && individualObj.children.length > 0);
  const isBottom = position === "left-bottom" || position === "right-bottom";
  const isTop = position === "left-top" || position === "right-top";
  const isMid = position === "right-mid";

  const renderChildrenBlock = () => {
    if (!hasChildren || !individualObj.children) return nothing;
    const children = individualObj.children;

    return html`
      <div class="individual-children ${isBottom ? "children-below" : "children-above"}">
        ${!isBottom
          ? html`
              <div class="children-circles-row">
                ${children.map((child, cIdx) => renderChildCircle(child, cIdx))}
              </div>
              <div class="children-lines-container">
                <svg viewBox="0 0 100 24" preserveAspectRatio="none" class="children-flow-svg">
                  ${children.map((child, cIdx) => renderChildLine(child, cIdx, children.length, false))}
                </svg>
              </div>
            `
          : html`
              <div class="children-lines-container">
                <svg viewBox="0 0 100 24" preserveAspectRatio="none" class="children-flow-svg">
                  ${children.map((child, cIdx) => renderChildLine(child, cIdx, children.length, true))}
                </svg>
              </div>
              <div class="children-circles-row">
                ${children.map((child, cIdx) => renderChildCircle(child, cIdx))}
              </div>
            `}
      </div>
    `;
  };

  const renderChildCircle = (child: IndividualObject, cIdx: number) => {
    const childDisplayState = displayValue(main.hass, config, child.state, {
      decimals: child.decimals,
      unit: child.unit,
      unitWhiteSpace: child.unit_white_space,
      watt_threshold: config.watt_threshold,
    });
    const childColor = child.color || child.field?.color || individualObj.color || "var(--primary-color)";

    return html`
      <div class="child-circle-wrapper">
        ${!isBottom ? html`<span class="label child-label">${child.name}</span>` : nothing}
        <div
          class="circle child-circle ${disableEntityClick ? "pointer-events-none" : ""}"
          style="border-color: ${childColor};"
          @click=${(e: MouseEvent) => main.onEntityClick(e, child.field, child.entity)}
          @dblclick=${(e: MouseEvent) => main.onEntityDoubleClick(e, child.field, child.entity)}
          @pointerdown=${(e: PointerEvent) => main.onEntityPointerDown(e, child.field, child.entity)}
          @pointerup=${(e: PointerEvent) => main.onEntityPointerUp(e)}
          @pointercancel=${(e: PointerEvent) => main.onEntityPointerUp(e)}
        >
          <ha-ripple .disabled=${disableEntityClick}></ha-ripple>
          ${child.icon && child.icon !== " "
            ? html`<ha-icon class="child-icon" style="color: ${childColor};" .icon=${child.icon}></ha-icon>`
            : nothing}
          <span class="child-state" style="color: ${childColor};">${childDisplayState}</span>
        </div>
        ${isBottom ? html`<span class="label child-label">${child.name}</span>` : nothing}
      </div>
    `;
  };

  const renderChildLine = (child: IndividualObject, cIdx: number, totalChildren: number, below: boolean) => {
    const childX = totalChildren === 1 ? 50 : 25 + (cIdx * 50) / (totalChildren - 1);
    const parentX = 50;
    const pathD = below
      ? `M${parentX},0 C${parentX},12 ${childX},12 ${childX},24`
      : `M${parentX},24 C${parentX},12 ${childX},12 ${childX},0`;

    const childPathId = `child-flow-${individualObj.name || safeIndex}-${cIdx}`.replace(/[^a-zA-Z0-9_-]/g, "_");
    const childColor = child.color || child.field?.color || individualObj.color || "var(--primary-color)";
    const totalConsumption = config.entities.individual?.reduce((sum, item) => sum + (Number((main.hass.states[item.entity]?.state) ?? 0)), 0) || 1;
    const childDur = computeFlowRate(config, child.state ?? 0, totalConsumption);

    return svg`
      <path
        id="${childPathId}"
        d="${pathD}"
        class="${styleLine(child.state || 0, config)}"
        style="stroke: ${childColor};"
        vector-effect="non-scaling-stroke"
      />
      ${checkShouldShowDots(config) && child.state && child.state > 0
        ? svg`<circle r="1.5" style="fill: ${childColor}; stroke: ${childColor};" vector-effect="non-scaling-stroke">
            <animateMotion
              dur="${computeIndividualFlowRate(child.field?.calculate_flow_rate, childDur)}s"
              repeatCount="indefinite"
              calcMode="paced"
              keyPoints="${child.invertAnimation ? "0;1" : "1;0"}"
              keyTimes="0;1"
            >
              <mpath xlink:href="#${childPathId}" />
            </animateMotion>
          </circle>`
        : nothing}
    `;
  };

  const renderHomeFlowLine = () => {
    if (!showLine(config, individualObj.state || 0) || config.entities.home?.hide) {
      return nothing;
    }

    if (position === "left-top") {
      return html`
        <svg width="80" height="30" class="individual-left-top-svg">
          <path d="M40 -10 v50" id="individual-top" class="${styleLine(individualObj.state || 0, config)}" />
          ${checkShouldShowDots(config) && individualObj.state && individualObj.state >= (individualObj.displayZeroTolerance ?? 0)
            ? svg`<circle r="1.75" class="individual-top" vector-effect="non-scaling-stroke">
                <animateMotion
                  dur="${computeIndividualFlowRate(individualObj?.field?.calculate_flow_rate, duration)}s"
                  repeatCount="indefinite"
                  calcMode="paced"
                  keyPoints="${individualObj.invertAnimation ? "0;1" : "1;0"}"
                  keyTimes="0;1"
                >
                  <mpath xlink:href="#individual-top" />
                </animateMotion>
              </circle>`
            : nothing}
        </svg>
      `;
    }

    if (position === "left-bottom") {
      return html`
        <svg width="80" height="30" class="individual-left-bottom-svg">
          <path d="M40 40 v-40" id="individual-bottom" class="${styleLine(individualObj?.state || 0, config)}" />
          ${checkShouldShowDots(config) && individualObj?.state && individualObj.state >= (individualObj.displayZeroTolerance ?? 0)
            ? svg`<circle r="1.75" class="individual-bottom" vector-effect="non-scaling-stroke">
                <animateMotion
                  dur="${computeIndividualFlowRate(individualObj.field?.calculate_flow_rate !== false, duration)}s"
                  repeatCount="indefinite"
                  calcMode="paced"
                  keyPoints="${individualObj.invertAnimation ? "0;1" : "1;0"}"
                  keyTimes="0;1"
                >
                  <mpath xlink:href="#individual-bottom" />
                </animateMotion>
              </circle>`
            : nothing}
        </svg>
      `;
    }

    if (position === "right-top") {
      const extraLeft = colIndex * 80;
      const pathId = `individual-top-right-home-${colIndex}`;
      return html`
        <div class="right-individual-flow-container col-${colIndex}">
          <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice" class="right-individual-flow">
            <path
              id="${pathId}"
              class="${styleLine(individualObj.state || 0, config)}"
              d="M${hasBottomRow ? 45 : 47},0 v15 c0,${hasBottomRow ? "30 -10,30 -30,30" : "35 -10,35 -30,35"} h-${20 + extraLeft}"
              vector-effect="non-scaling-stroke"
            />
            ${checkShouldShowDots(config) && individualObj.state && individualObj.state >= (individualObj.displayZeroTolerance ?? 0)
              ? svg`<circle r="1" class="individual-top" vector-effect="non-scaling-stroke">
                  <animateMotion
                    dur="${computeIndividualFlowRate(individualObj?.field?.calculate_flow_rate, duration)}s"
                    repeatCount="indefinite"
                    calcMode="paced"
                    keyPoints="${individualObj.invertAnimation ? "0;1" : "1;0"}"
                    keyTimes="0;1"
                  >
                    <mpath xlink:href="#${pathId}" />
                  </animateMotion>
                </circle>`
              : nothing}
          </svg>
        </div>
      `;
    }

    if (position === "right-bottom") {
      const extraLeft = colIndex * 80;
      const pathId = `individual-bottom-right-home-${colIndex}`;
      return html`
        <div class="right-individual-flow-container col-${colIndex}">
          <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice" class="right-individual-flow">
            <path
              id="${pathId}"
              class="${styleLine(individualObj.state || 0, config)}"
              d="M45,100 v-15 c0,-30 -10,-30 -30,-30 h-${20 + extraLeft}"
              vector-effect="non-scaling-stroke"
            />
            ${checkShouldShowDots(config) && individualObj.state && individualObj.state >= (individualObj.displayZeroTolerance ?? 0)
              ? svg`<circle r="1" class="individual-bottom" vector-effect="non-scaling-stroke">
                  <animateMotion
                    dur="${computeIndividualFlowRate(individualObj?.field?.calculate_flow_rate, duration)}s"
                    repeatCount="indefinite"
                    calcMode="paced"
                    keyPoints="${individualObj.invertAnimation ? "0;1" : "1;0"}"
                    keyTimes="0;1"
                  >
                    <mpath xlink:href="#${pathId}" />
                  </animateMotion>
                </circle>`
              : nothing}
          </svg>
        </div>
      `;
    }

    if (position === "right-mid") {
      const extraLeft = colIndex * 80;
      const pathId = `individual-mid-right-home-${colIndex}`;
      return html`
        <div class="right-individual-flow-container mid col-${colIndex}">
          <svg viewBox="0 0 100 20" preserveAspectRatio="none" class="right-individual-flow mid">
            <path
              id="${pathId}"
              class="${styleLine(individualObj.state || 0, config)}"
              d="M0,10 h${100 + extraLeft}"
              vector-effect="non-scaling-stroke"
            />
            ${checkShouldShowDots(config) && individualObj.state && individualObj.state >= (individualObj.displayZeroTolerance ?? 0)
              ? svg`<circle r="1" class="individual-mid" vector-effect="non-scaling-stroke">
                  <animateMotion
                    dur="${computeIndividualFlowRate(individualObj?.field?.calculate_flow_rate, duration)}s"
                    repeatCount="indefinite"
                    calcMode="paced"
                    keyPoints="${individualObj.invertAnimation ? "0;1" : "1;0"}"
                    keyTimes="0;1"
                  >
                    <mpath xlink:href="#${pathId}" />
                  </animateMotion>
                </circle>`
              : nothing}
          </svg>
        </div>
      `;
    }

    return nothing;
  };

  const containerClasses = [
    "circle-container",
    isTop ? "individual-top" : "",
    isBottom ? "individual-bottom bottom" : "",
    isMid ? "individual-middle" : "",
    position.startsWith("right") ? "individual-right" : "",
    position === "right-top" ? "individual-right-top" : "",
    position === "right-bottom" ? "individual-right-bottom" : "",
    position === "right-mid" ? "individual-right-mid" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const spanClass = [
    isTop ? "individual-top" : "",
    isBottom ? "individual-bottom" : "",
    isMid ? "individual-mid" : "",
    position === "left-top" ? "individual-left-top" : "",
    position === "left-bottom" ? "individual-left-bottom" : "",
    position === "right-top" ? "individual-right-top" : "",
    position === "right-bottom" ? "individual-right-bottom" : "",
    position === "right-mid" ? "individual-right-mid" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const secField = position === "left-top" ? "left-top" : position === "left-bottom" ? "left-bottom" : position === "right-top" ? "right-top" : "right-bottom";

  return html`
    <div class="individual-branch ${isBottom ? "branch-bottom" : "branch-top"} ${isMid ? "branch-mid" : ""}">
      ${!isBottom ? renderChildrenBlock() : nothing}

      <div class="${containerClasses}">
        ${!isBottom ? html`<span class="label">${individualObj.name}</span>` : nothing}
        ${position === "left-bottom" ? renderHomeFlowLine() : nothing}

        <div
          class="circle ${disableEntityClick ? "pointer-events-none" : ""}"
          @click=${(e: MouseEvent) => main.onEntityClick(e, individualObj?.field, individualObj?.entity)}
          @dblclick=${(e: MouseEvent) => main.onEntityDoubleClick(e, individualObj?.field, individualObj?.entity)}
          @pointerdown=${(e: PointerEvent) => main.onEntityPointerDown(e, individualObj?.field, individualObj?.entity)}
          @pointerup=${(e: PointerEvent) => main.onEntityPointerUp(e)}
          @pointercancel=${(e: PointerEvent) => main.onEntityPointerUp(e)}
          @keyDown=${(e: { key: string; stopPropagation: () => void; target: HTMLElement }) => {
            if (e.key === "Enter") main.openDetails(e, individualObj?.field, individualObj?.entity, "tap");
          }}
        >
          <ha-ripple .disabled=${disableEntityClick}></ha-ripple>
          ${individualSecondarySpan(main.hass, main, config, templatesObj, individualObj, safeIndex, secField)}
          ${individualObj.icon !== " " ? html`<ha-icon id="individual-icon-${safeIndex}" .icon=${individualObj.icon}></ha-icon>` : nothing}
          ${individualObj?.field?.display_zero_state !== false || (individualObj.state || 0) > (individualObj.displayZeroTolerance ?? 0)
            ? html`<span class="${spanClass}">
                ${individualObj?.showDirection
                  ? html`<ha-icon class="small" .icon=${individualObj.invertAnimation ? (isBottom ? "mdi:arrow-up" : "mdi:arrow-down") : isBottom ? "mdi:arrow-down" : "mdi:arrow-up"}></ha-icon>`
                  : nothing}${displayState}
              </span>`
            : nothing}
        </div>

        ${isBottom ? html`<span class="label">${individualObj.name}</span>` : nothing}
        ${position !== "left-bottom" ? renderHomeFlowLine() : nothing}
      </div>

      ${isBottom ? renderChildrenBlock() : nothing}
    </div>
  `;
};
