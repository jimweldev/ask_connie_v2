<?php

namespace App\Helpers;

use Illuminate\Database\Eloquent\Builder;

/**
 * Class QueryHelper
 *
 * Provides helper methods to apply common query operations (filtering, sorting,
 * pagination) to Eloquent queries based on request parameters.
 */
class QueryHelper {
    /**
     * Keys that are reserved for query operations and should not be treated as filters.
     */
    private const RESERVED_KEYS = [
        'limit',
        'page',
        'search',
        'sort',
        'with',
        'has',
        'group_filters',
    ];

    /**
     * Apply query parameters such as filtering and sorting to an Eloquent query.
     *
     * @param  Builder  $query  The Eloquent query builder instance
     * @param  array  $params  Query parameters from the request
     *
     * @example
     * /api/user-infos?sort=id                    → Sort by id ascending
     * /api/user-infos?sort=-id                   → Sort by id descending
     * /api/user-infos?sort=-id,first_name        → Sort by id DESC, then first_name ASC
     * /api/user-infos?first_name=admin           → Filter where first_name is 'admin'
     * /api/user-infos?id[gt]=5                   → Filter where id > 5
     * /api/user-infos?id[lt]=5                   → Filter where id < 5
     * /api/user-infos?id[gte]=3&id[lte]=5        → Filter where id >= 3 and id <= 5
     */
    public static function apply(Builder $query, array $params): void {
        foreach ($params as $key => $value) {
            // Skip null values
            if ($value === null) {
                continue;
            }

            // Handle sorting
            if ($key === 'sort') {
                self::applySorting($query, $value);

                continue;
            }

            // Handle group filters (OR conditions sent in POST body)
            if ($key === 'group_filters' && is_array($value)) {
                self::applyGroupFilters($query, $value);

                continue;
            }

            // Handle advanced filters (e.g., gt, lt, like)
            if (is_array($value)) {
                self::applyArrayFilters($query, $key, $value);

                continue;
            }

            // Apply simple key-value filtering for non-reserved keys
            if (!in_array($key, self::RESERVED_KEYS, true)) {
                $query->where($key, 'ILIKE', $value);
            }
        }
    }

    /**
     * Apply group filters to the query.
     *
     * Group filters allow complex OR/AND logic where:
     * - Each group is OR'd with other groups
     * - Conditions within each group are AND'd together
     *
     * @param  Builder  $query  The Eloquent query builder instance
     * @param  array  $groupFilters  Array of filter groups
     *
     * @example
     * [
     *   // Group 1: (email LIKE '%admin%' AND status == 'active')
     *   [
     *     ['field' => 'email', 'operator' => 'like', 'value' => 'admin'],
     *     ['field' => 'status', 'operator' => '==', 'value' => 'active'],
     *   ],
     *   // Group 2: (role == 'super_admin')
     *   [
     *     ['field' => 'role', 'operator' => '==', 'value' => 'super_admin'],
     *   ],
     * ]
     * // Results in: (email LIKE '%admin%' AND status = 'active') OR (role = 'super_admin')
     */
    private static function applyGroupFilters(Builder $query, array $groupFilters): void {
        if (empty($groupFilters)) {
            return;
        }

        $query->where(function (Builder $query) use ($groupFilters) {
            foreach ($groupFilters as $filters) {
                if (!is_array($filters) || empty($filters)) {
                    continue;
                }

                // Each group is an OR condition
                $query->orWhere(function (Builder $groupQuery) use ($filters) {
                    foreach ($filters as $filter) {
                        // Skip invalid filter entries
                        if (!isset($filter['field'], $filter['operator'], $filter['value'])) {
                            continue;
                        }

                        $field = $filter['field'];
                        $operator = $filter['operator'];
                        $value = $filter['value'];

                        // Map frontend operator to SQL operator
                        $sqlOperator = self::mapOperator($operator);

                        // Apply the condition with appropriate operator
                        if ($operator === 'like') {
                            $groupQuery->where($field, $sqlOperator, '%'.$value.'%');
                        } else {
                            $groupQuery->where($field, $sqlOperator, $value);
                        }
                    }
                });
            }
        });
    }

    /**
     * Map frontend operator symbols to SQL operators.
     *
     * @param  string  $operator  Frontend operator (==, !=, >, >=, <, <=, like)
     * @return string SQL operator
     */
    private static function mapOperator(string $operator): string {
        $operatorMap = [
            '==' => '=',
            '!=' => '!=',
            '>' => '>',
            '>=' => '>=',
            '<' => '<',
            '<=' => '<=',
            'like' => 'LIKE',
        ];

        return $operatorMap[$operator] ?? '=';
    }

    /**
     * Apply sorting to the query.
     *
     * Supports:
     * - Multiple fields (comma-separated)
     * - Descending order using '-' prefix
     * - Special handling for 'full_name' (splits into first_name + last_name)
     *
     * @param  Builder  $query  The Eloquent query builder instance
     * @param  string  $sortValue  Comma-separated sort parameters (e.g., '-id,name')
     */
    private static function applySorting(Builder $query, string $sortValue): void {
        $sortParams = explode(',', $sortValue);

        foreach ($sortParams as $param) {
            // Determine sort direction based on '-' prefix
            $direction = str_starts_with($param, '-') ? 'desc' : 'asc';
            $column = ltrim($param, '-');

            // Special handling for 'full_name' - sort by first and last name
            if ($column === 'full_name') {
                $query->orderBy('first_name', $direction)
                    ->orderBy('last_name', $direction);
            } else {
                $query->orderBy($column, $direction);
            }
        }
    }

    /**
     * Apply advanced filter conditions to a field.
     *
     * Supports comparison operators passed as array keys:
     * - gt (greater than), gte (greater than or equal)
     * - lt (less than), lte (less than or equal)
     * - eq (equal), neq (not equal)
     * - like (partial match)
     *
     * @param  Builder  $query  The Eloquent query builder instance
     * @param  string  $key  The field name
     * @param  array  $conditions  Array of conditions (e.g., ['gt' => 5, 'lt' => 10])
     *
     * @example
     * id[gt]=5& id[lt]=10  →  WHERE id > 5 AND id < 10
     * name[like]=john      →  WHERE name LIKE '%john%'
     */
    private static function applyArrayFilters(Builder $query, string $key, array $conditions): void {
        $operators = [
            'lt' => '<',
            'lte' => '<=',
            'gt' => '>',
            'gte' => '>=',
            'eq' => '=',
            'neq' => '!=',
            'like' => 'ILIKE',
        ];

        foreach ($conditions as $operator => $value) {
            if (isset($operators[$operator])) {
                // For 'like' operator, wrap value with wildcards for partial matching
                if ($operator === 'like') {
                    $value = '%'.$value.'%';
                }

                $query->where($key, $operators[$operator], $value);
            } else {
                // Fallback: treat as dot-notation for nested relationships
                $query->where($key.'.'.$operator, $value);
            }
        }
    }

    /**
     * Apply limit and offset for pagination.
     *
     * @param  Builder  $query  The Eloquent query builder instance
     * @param  int  $limit  Number of records per page
     * @param  int  $page  Page number (1-indexed)
     * @return Builder The modified query builder instance
     *
     * @example
     * limit=10, page=3  →  LIMIT 10 OFFSET 20  (records 21-30)
     */
    public static function applyLimitAndOffset(Builder $query, int $limit, int $page): Builder {
        return $query->limit($limit)->offset(($page - 1) * $limit);
    }
}
