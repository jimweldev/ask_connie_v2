<?php

namespace App\Http\Controllers\System;

use App\Helpers\DynamicLogger;
use App\Helpers\QueryHelper;
use App\Http\Controllers\Controller;
use App\Models\System\SystemSetting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Class SystemSettingController
 *
 * Controller for managing SystemSetting resources.
 * Provides CRUD operations with filtering, sorting, and pagination support.
 */
class SystemSettingController extends Controller {
    private $logger;

    public function __construct() {
        $this->logger = DynamicLogger::create('laravel.log', 'local');
    }

    /**
     * Display a paginated list of records with optional filtering and search.
     *
     * @param  Request  $request  The HTTP request instance
     */
    public function index(Request $request): JsonResponse {
        $queryParams = $request->all();

        try {
            // Build the base query
            $query = SystemSetting::query();

            // Apply query filters (sorting, advanced filters, group filters)
            QueryHelper::apply($query, $queryParams);

            // Apply search across id and name fields
            if ($request->has('search')) {
                $search = $request->input('search');
                $query->where(function ($query) use ($search) {
                    $query->where('id', 'ILIKE', '%'.$search.'%')
                        ->orWhere('name', 'ILIKE', '%'.$search.'%');
                });
            }

            // Get total count before pagination
            $totalRecords = $query->count();

            // Apply pagination
            $limit = $request->input('limit', 10);
            $page = $request->input('page', 1);
            QueryHelper::applyLimitAndOffset($query, $limit, $page);

            // Execute query and return results
            $records = $query->get();

            return response()->json([
                'records' => $records,
                'meta' => [
                    'total_records' => $totalRecords,
                    'total_pages' => ceil($totalRecords / $limit),
                ],
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'An error occurred',
                'error' => $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Display the specified record.
     *
     * @param  int  $id  The record ID
     */
    public function show($id): JsonResponse {
        $record = SystemSetting::where('id', $id)->first();

        if (!$record) {
            return response()->json([
                'message' => 'Record not found.',
            ], 404);
        }

        return response()->json($record, 200);
    }

    /**
     * Store a newly created record in storage.
     *
     * @param  Request  $request  The HTTP request instance
     */
    public function store(Request $request): JsonResponse {
        try {
            $record = SystemSetting::create($request->all());

            return response()->json($record, 201);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'An error occurred',
                'error' => $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Update the specified record in storage.
     *
     * @param  Request  $request  The HTTP request instance
     * @param  int  $id  The record ID
     */
    public function update(Request $request, $id): JsonResponse {
        try {
            $record = SystemSetting::find($id);

            if (!$record) {
                return response()->json([
                    'message' => 'Record not found.',
                ], 404);
            }

            $record->update($request->all());

            return response()->json($record, 200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'An error occurred',
                'error' => $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Remove the specified record from storage.
     *
     * @param  int  $id  The record ID
     */
    public function destroy($id): JsonResponse {
        try {
            $record = SystemSetting::find($id);

            if (!$record) {
                return response()->json([
                    'message' => 'Record not found.',
                ], 404);
            }

            $record->delete();

            return response()->json($record, 200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'An error occurred',
                'error' => $e->getMessage(),
            ], 400);
        }
    }
}
