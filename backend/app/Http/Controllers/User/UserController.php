<?php

namespace App\Http\Controllers\User;

use App\Helpers\DynamicLogger;
use App\Helpers\QueryHelper;
use App\Helpers\StorageHelper;
use App\Http\Controllers\Controller;
use App\Models\User\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Class UserController
 *
 * Controller for managing User resources.
 * Provides CRUD operations with filtering, sorting, and pagination support.
 */
class UserController extends Controller {
    private $logger;

    public function __construct() {
        $this->logger = DynamicLogger::create('laravel.log', 'local');
    }

    // ACTIVE USERS
    /**
     * Display a paginated list of records with optional filtering and search.
     *
     * @param  Request  $request  The HTTP request instance
     */
    public function index(Request $request): JsonResponse {
        $queryParams = $request->all();

        try {
            // Build the base query
            $query = User::query();

            // Apply query filters (sorting, advanced filters, group filters)
            QueryHelper::apply($query, $queryParams);

            // Apply search across searchable fields
            if ($request->has('search')) {
                $search = $request->input('search');
                $query->where(function ($query) use ($search) {
                    $query->where('id', 'ILIKE', '%'.$search.'%')
                        ->orWhere('email', 'ILIKE', '%'.$search.'%')
                        ->orWhere('password', 'ILIKE', '%'.$search.'%');
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
        $record = User::where('id', $id)->first();

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
            // Handle file uploads
            if ($request->hasFile('avatar')) {
                $avatar = $request->file('avatar');
                $avatarPath = StorageHelper::uploadFile($avatar, 'avatars');
                if ($avatarPath) {
                    $request['avatar_path'] = $avatarPath;
                }
            }

            $record = User::create($request->all());

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
            $record = User::find($id);

            if (!$record) {
                return response()->json([
                    'message' => 'Record not found.',
                ], 404);
            }

            // Handle file uploads
            if ($request->hasFile('avatar')) {
                // Delete old file if exists
                if ($record->avatar_path) {
                    StorageHelper::deleteFile($record->avatar_path);
                }

                $avatar = $request->file('avatar');
                $avatarPath = StorageHelper::uploadFile($avatar, 'avatars');
                if ($avatarPath) {
                    $request['avatar_path'] = $avatarPath;
                }
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
            $record = User::find($id);

            if (!$record) {
                return response()->json([
                    'message' => 'Record not found.',
                ], 404);
            }

            // Delete associated files
            if ($record->avatar_path) {
                StorageHelper::deleteFile($record->avatar_path);
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

    // ARCHIVED USERS
    /**
     * Display a paginated list of records with optional filtering and search.
     *
     * @param  Request  $request  The HTTP request instance
     */
    public function archivedUsers(Request $request): JsonResponse {
        $queryParams = $request->all();

        try {
            // Build the base query
            $query = User::onlyTrashed();

            // Apply query filters (sorting, advanced filters, group filters)
            QueryHelper::apply($query, $queryParams);

            // Apply search across searchable fields
            if ($request->has('search')) {
                $search = $request->input('search');
                $query->where(function ($query) use ($search) {
                    $query->where('id', 'ILIKE', '%'.$search.'%')
                        ->orWhere('email', 'ILIKE', '%'.$search.'%')
                        ->orWhere('password', 'ILIKE', '%'.$search.'%');
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
     * Restore the specified record from storage.
     *
     * @param  int  $id  The record ID
     */
    public function restoreArchivedUser($id): JsonResponse {
        try {
            $record = User::withTrashed()->find($id);

            if (!$record) {
                return response()->json([
                    'message' => 'Record not found.',
                ], 404);
            }

            $record->restore();

            return response()->json($record, 200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'An error occurred',
                'error' => $e->getMessage(),
            ], 400);
        }
    }
}
