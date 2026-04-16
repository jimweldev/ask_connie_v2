<?php

namespace App\Http\Controllers\Select;

use App\Helpers\QueryHelper;
use App\Http\Controllers\Controller;
use App\Models\System\SystemDropdown;
use App\Models\System\SystemDropdownModule;
use App\Models\System\SystemDropdownModuleType;
use Illuminate\Http\Request;

class SelectController extends Controller {
    /**
     * Display a paginated list of system system dropdowns with optional filtering and search.
     */
    public function getSelectSystemDropdowns(Request $request) {
        $queryParams = $request->all();

        try {
            $query = SystemDropdown::query();

            QueryHelper::apply($query, $queryParams);

            if ($request->has('search')) {
                $search = $request->input('search');
                $query->where(function ($query) use ($search) {
                    $query->where('label', 'ILIKE', '%'.$search.'%');
                });
            }

            $total = $query->count();

            $limit = $request->input('limit', 10);
            $page = $request->input('page', 1);
            QueryHelper::applyLimitAndOffset($query, $limit, $page);

            $records = $query->get();

            return response()->json([
                'records' => $records,
                'meta' => [
                    'total_records' => $total,
                    'total_pages' => ceil($total / $limit),
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'An error occurred.',
                'error' => $e->getMessage(),
            ], 400);
        }
    }

    public function getSelectSystemDropdownModules(Request $request) {
        $queryParams = $request->all();

        try {
            $query = SystemDropdownModule::query();

            QueryHelper::apply($query, $queryParams);

            if ($request->has('search')) {
                $search = $request->input('search');
                $query->where(function ($query) use ($search) {
                    $query->where('label', 'ILIKE', '%'.$search.'%');
                });
            }

            $total = $query->count();

            $limit = $request->input('limit', 10);
            $page = $request->input('page', 1);
            QueryHelper::applyLimitAndOffset($query, $limit, $page);

            $records = $query->get();

            return response()->json([
                'records' => $records,
                'meta' => [
                    'total_records' => $total,
                    'total_pages' => ceil($total / $limit),
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'An error occurred.',
                'error' => $e->getMessage(),
            ], 400);
        }
    }

    public function getSelectSystemDropdownModuleTypes(Request $request) {
        $queryParams = $request->all();

        $module = $request->input('module');

        unset($queryParams['module']);

        try {
            $query = SystemDropdownModuleType::whereHas('system_dropdown_module', function ($q) use ($module) {
                $q->where('label', $module);
            });

            QueryHelper::apply($query, $queryParams);

            if ($request->has('search')) {
                $search = $request->input('search');
                $query->where(function ($query) use ($search) {
                    $query->where('label', 'ILIKE', '%'.$search.'%');
                });
            }

            $total = $query->count();

            $limit = $request->input('limit', 10);
            $page = $request->input('page', 1);
            QueryHelper::applyLimitAndOffset($query, $limit, $page);

            $records = $query->get();

            return response()->json([
                'records' => $records,
                'meta' => [
                    'total_records' => $total,
                    'total_pages' => ceil($total / $limit),
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'An error occurred.',
                'error' => $e->getMessage(),
            ], 400);
        }
    }
}
