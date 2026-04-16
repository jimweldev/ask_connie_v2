<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\Example\ExampleTaskController;
use App\Http\Controllers\Rag\RagFileController;
use App\Http\Controllers\Select\SelectController;
use App\Http\Controllers\System\SystemDropdownController;
use App\Http\Controllers\System\SystemDropdownModuleController;
use App\Http\Controllers\System\SystemSettingController;
use App\Http\Controllers\User\UserController;
use Illuminate\Support\Facades\Route;

Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/login', [AuthController::class, 'loginWithPassword']);

Route::middleware('jwt.auth')->group(function () {
    Route::resource('/example/tasks', ExampleTaskController::class);

    // System Settings
    Route::resource('/system/settings', SystemSettingController::class);

    // System Dropdowns
    Route::resource('/system/dropdowns', SystemDropdownController::class);

    // System Dropdown Moduleies
    Route::resource('/system/dropdown-modules', SystemDropdownModuleController::class);

    Route::get('/select/system-dropdowns', [SelectController::class, 'getSelectSystemDropdowns']);
    Route::get('/select/system-dropdown-modules', [SelectController::class, 'getSelectSystemDropdownModules']);
    Route::get('/select/system-dropdown-module-types', [SelectController::class, 'getSelectSystemDropdownModuleTypes']);

    // Users
    Route::resource('/users', UserController::class);

    // Archived Users
    Route::get('/archived-users', [UserController::class, 'archivedUsers']);
    Route::post('/archived-users/restore/{id}', [UserController::class, 'restoreArchivedUser']);

    // Rag Files
    Route::resource('/rag/files', RagFileController::class);

    // Chat endpoints
    Route::post('/chat', [RagFileController::class, 'chat']);
    Route::post('/chat/stream', [RagFileController::class, 'chatStream']);
});
