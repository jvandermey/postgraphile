select
  __people__."username" as "0",
  __people__."person_id"::text as "1"
from interfaces_and_unions.people as __people__
where (
  true /* authorization checks */
)
order by __people__."person_id" asc

select __relational_items_result__.*
from (
  select
    ids.ordinality - 1 as idx,
    (ids.value->>0)::"int4" as "id0"
  from json_array_elements($1::json) with ordinality as ids
) as __relational_items_identifiers__,
lateral (
  select
    __relational_items__."type"::text as "0",
    __relational_items__."id"::text as "1",
    __relational_items__."type2"::text as "2",
    __relational_items__."position"::text as "3",
    to_char(__relational_items__."created_at", 'YYYY-MM-DD"T"HH24:MI:SS.USTZHTZM') as "4",
    to_char(__relational_items__."updated_at", 'YYYY-MM-DD"T"HH24:MI:SS.USTZHTZM') as "5",
    __relational_items__."is_explicitly_archived"::text as "6",
    to_char(__relational_items__."archived_at", 'YYYY-MM-DD"T"HH24:MI:SS.USTZHTZM') as "7",
    __relational_items_identifiers__.idx as "8"
  from interfaces_and_unions.relational_items as __relational_items__
  where
    (
      true /* authorization checks */
    ) and (
      __relational_items__."author_id" = __relational_items_identifiers__."id0"
    )
  order by __relational_items__."id" asc
) as __relational_items_result__