import type { ExecutablePlan } from "graphile-crystal";
import type { SQL, SQLRawValue } from "pg-sql2";

import type {
  PgSourceColumns,
  PgSourceParameter,
  PgSourceRelation,
  PgSourceUnique,
} from "./datasource";
import type { PgDeletePlan } from "./plans/pgDelete";
import type { PgInsertPlan } from "./plans/pgInsert";
import type { PgSelectSinglePlan } from "./plans/pgSelectSingle";
import type { PgUpdatePlan } from "./plans/pgUpdate";

/**
 * A class-like source of information - could be from `SELECT`-ing a row, or
 * `INSERT...RETURNING` or similar. *ALWAYS* represents a single row (or null).
 */
export type PgClassSinglePlan<
  TColumns extends PgSourceColumns | undefined,
  TUniques extends ReadonlyArray<PgSourceUnique<Exclude<TColumns, undefined>>>,
  TRelations extends {
    [identifier: string]: TColumns extends PgSourceColumns
      ? PgSourceRelation<TColumns, any>
      : never;
  },
  TParameters extends PgSourceParameter[] | undefined = undefined,
> =
  | PgSelectSinglePlan<TColumns, TUniques, TRelations, TParameters>
  | PgInsertPlan<TColumns, TUniques, TRelations>
  | PgUpdatePlan<TColumns, TUniques, TRelations>
  | PgDeletePlan<TColumns, TUniques, TRelations>;

/**
 * Given a value of type TInput, returns an `SQL` value to insert into an SQL
 * statement.
 */
export type PgEncode<TInput> = (value: TInput) => SQLRawValue;

/**
 * Given a text value from PostgreSQL, returns the value cast to TCanonical.
 */
export type PgDecode<TForJavaScript, TFromPostgres = string> = (
  value: TFromPostgres,
) => TForJavaScript;

export interface PgTypeCodecExtensions {}

export interface PgTypeCodec<
  TColumns extends PgSourceColumns | undefined,
  TFromPostgres,
  TFromJavaScript = TFromPostgres,
  TArrayItemCodec extends
    | PgTypeCodec<any, any, any, undefined>
    | undefined = undefined,
> {
  /**
   * Unique name to identify this codec.
   */
  name: string;

  /**
   * Given a value of type TFromJavaScript, returns an `SQL` value to insert into an SQL
   * statement.
   */
  toPg: PgEncode<TFromJavaScript>;

  /**
   * Given a text value from PostgreSQL, returns the value cast to TCanonical.
   */
  fromPg: PgDecode<TFromJavaScript, TFromPostgres>;

  // TODO: rename?
  /**
   * We'll append `::text` by default to each selection; however if this type
   * needs something special (e.g. `money` should be converted to `numeric`
   * before being converted to `text`) then you can provide this custom
   * callback to provide your own casting - this could even include function
   * calls if you want.
   */
  castFromPg?: (fragment: SQL) => SQL;

  /**
   * If you provide `castFromPg` you probably ought to also specify
   * `listCastFromPg` so that a list of this type can be converted properly.
   */
  listCastFromPg?: (fragment: SQL) => SQL;

  /**
   * When we have an expression of this type, we can safely cast it within
   * Postgres using the cast `(${expression})::${sqlType}` to make the type
   * explicit.
   */
  sqlType: SQL;

  /**
   * If true, this is an anonymous type (e.g. the return type of a
   * `returns record` or `returns table` PostgreSQL function) and thus should
   * not be referenced via `sqlType` directly.
   */
  isAnonymous?: boolean;

  // TODO: extract this to a different interface
  /**
   * If this is a composite type, the columns it supports.
   */
  columns: TColumns;

  /**
   * A callback to return `'true'` (text string) if the composite type
   * represented by this codec is non-null, and `null` or `'false'` otherwise.
   *
   * If this codec represents a composite type (e.g. a row or other type with
   * multiple columns) and this type can be returned from a function then
   * there's a risk that the function may return null/an all-nulls composite
   * type. This can occur with `returns some_composite_type` or
   * `returns setof some_composite_type`, though the former is more common as
   * you explicitly need to return nulls in the latter.
   *
   * We can't simply do `not (foo is null)` because you might be using
   * column-level select grants which would prevent this happening. As such we
   * give you a chance to provide your own non-null check. In most table cases
   * you can use `(${alias}.id is not null)::text` (assuming 'id' is the name
   * of your primary key); for composite types you can normally do
   * `(not (${alias} is null))::text`.
   */
  notNullExpression?: (alias: SQL) => SQL;

  /**
   * If set, this represents a PostgreSQL array type. Please note: array types
   * should NOT be nested.
   */
  arrayOfCodec?: TArrayItemCodec;

  /**
   * The underlying codec that this type is a domain over.
   */
  domainOfCodec?: PgTypeCodec<any, any, any, any>;
  /**
   * If this is a domain, does it add a non-null constraint?
   */
  notNull?: boolean;

  /**
   * The underlying codec that this type is a range over.
   */
  rangeOfCodec?: PgTypeCodec<undefined, any, any, undefined>;

  extensions?: Partial<PgTypeCodecExtensions>;
}

export interface PgEnumTypeCodec<TValue extends string>
  extends PgTypeCodec<undefined, string, TValue> {
  values: TValue[];
}

export interface PgTypedExecutablePlan<
  TCodec extends PgTypeCodec<any, any, any>,
> extends ExecutablePlan<any> {
  pgCodec: TCodec;
}

export interface PgOrderSpec {
  fragment: SQL;
  codec: PgTypeCodec<any, any, any>;
  direction: "ASC" | "DESC";
  nulls?: "FIRST" | "LAST" | null;
}

export interface PgGroupSpec {
  fragment: SQL;
  // codec: PgTypeCodec<any, any, any>;
  // TODO: consider if 'cube', 'rollup', 'grouping sets' need special handling or can just be part of the fragment
}

export type TuplePlanMap<
  TColumns extends { [column: string]: any },
  TTuple extends ReadonlyArray<keyof TColumns>,
> = {
  [Index in keyof TTuple]: {
    // Optional columns
    [key in keyof TColumns as Exclude<
      key,
      keyof TTuple[number]
    >]?: ExecutablePlan<ReturnType<TColumns[key]["pg2gql"]>>;
  } & {
    // Required unique combination of columns
    [key in TTuple[number]]: ExecutablePlan<
      ReturnType<TColumns[key]["pg2gql"]>
    >;
  };
};

export type PlanByUniques<
  TColumns extends PgSourceColumns | undefined,
  TUniqueColumns extends ReadonlyArray<
    PgSourceUnique<Exclude<TColumns, undefined>>
  >,
> = TColumns extends PgSourceColumns
  ? TuplePlanMap<TColumns, TUniqueColumns[number]["columns"] & string[]>[number]
  : undefined;
