import chalk from "chalk";
import { getNamedType } from "graphql";

import { getGlobalState } from "../global";
import type { ExecutablePlan } from "../plan";
import { isListCapablePlan } from "../plan";
import type { __ItemPlan } from "./__item";
import { each } from "./each";
import type {
  __ListTransformPlan,
  ListTransformItemPlanCallback,
  ListTransformReduce,
} from "./listTransform";
import { listTransform } from "./listTransform";

type Memo = Map<unknown, unknown[]>;

const reduceCallback: ListTransformReduce<Memo, any> = (
  memo,
  entireItemValue,
  idx,
) => {
  let list = memo.get(idx);
  if (!list) {
    list = [];
    memo.set(idx, list);
  }
  list.push(entireItemValue);
  return memo;
};

const initialState = (): Memo => new Map();

/**
 * Takes a single dimensional list plan and a mapper that returns a grouping
 * key. Returns a plan that results in a Map where the keys are the grouping
 * keys and the values are lists of the original entries that match these
 * grouping keys.
 */
export function groupBy<
  TListPlan extends ExecutablePlan<readonly any[]>,
  TItemPlan extends ExecutablePlan<number>,
>(
  listPlan: TListPlan,
  mapper: ListTransformItemPlanCallback<TListPlan, TItemPlan>,
): __ListTransformPlan<TListPlan, TItemPlan, Memo, any> {
  const currentGraphQLType = getGlobalState().currentGraphQLType;
  if (!currentGraphQLType) {
    throw new Error("partitionByIndex cannot be used in this position");
  }
  const namedType = getNamedType(currentGraphQLType);
  return listTransform<TListPlan, TItemPlan, Memo, any>({
    listPlan,
    itemPlanCallback: mapper,
    initialState,
    reduceCallback: reduceCallback,
    listItem: isListCapablePlan(listPlan)
      ? (itemPlan) => {
          return each(itemPlan as any, ($item) =>
            listPlan.listItem($item as any),
          );
        }
      : undefined,
    namedType,
    meta: `groupBy:${chalk.yellow(listPlan.id)}${
      mapper.name ? `/${mapper.name}` : ""
    }`,
  });
}