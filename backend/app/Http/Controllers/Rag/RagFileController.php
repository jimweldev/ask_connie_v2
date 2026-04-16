<?php

namespace App\Http\Controllers\Rag;

use App\Ai\Agents\MegaToolAgent;
use App\Helpers\DynamicLogger;
use App\Helpers\QueryHelper;
use App\Helpers\StorageHelper;
use App\Http\Controllers\Controller;
use App\Jobs\Rag\EmbedRagFileChunk;
use App\Models\Chat\Chat;
use App\Models\Rag\RagFile;
use App\Models\Rag\RagFileChunk;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RagFileController extends Controller {
    private $logger;

    public function __construct() {
        $this->logger = DynamicLogger::create('laravel.log', 'local');
    }

    /**
     * Display a paginated list of records with optional filtering and search.
     */
    public function index(Request $request) {
        $queryParams = $request->all();

        try {
            $query = RagFile::query();
            $type = 'paginate';
            QueryHelper::apply($query, $queryParams, $type);

            if ($request->has('search')) {
                $search = $request->input('search');
                $query->where(function ($query) use ($search) {
                    $query->where('id', 'LIKE', '%'.$search.'%');
                });
            }

            $totalRecords = $query->count();
            $limit = $request->input('limit', 10);
            $page = $request->input('page', 1);
            QueryHelper::applyLimitAndOffset($query, $limit, $page);

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
     */
    public function show($id) {
        $record = RagFile::where('id', $id)->first();

        if (!$record) {
            return response()->json([
                'message' => 'Record not found.',
            ], 404);
        }

        return response()->json($record, 200);
    }

    /**
     * Store a newly created record in storage.
     */
    public function store(Request $request) {
        try {
            $filePath = StorageHelper::uploadFile($request->file('file'), 'rag_files');

            if (!$filePath) {
                return response()->json([
                    'message' => 'Failed to upload file.',
                ], 400);
            }

            // Merge unique files
            $request->merge([
                'file_path' => $filePath,
            ]);

            $allowedLocations = json_decode($request->allowed_locations, true);
            $allowedPositions = json_decode($request->allowed_positions, true);
            $allowedWebsites = json_decode($request->allowed_websites, true);

            $request['allowed_locations'] = empty($allowedLocations) ? null : $allowedLocations;
            $request['allowed_positions'] = empty($allowedPositions) ? null : $allowedPositions;
            $request['allowed_websites'] = empty($allowedWebsites) ? null : $allowedWebsites;

            $record = RagFile::create($request->all());

            $extractedText = StorageHelper::extractFileContent($record->file_path);

            $chunks = array_filter(preg_split('/\s+/', $extractedText));
            $chunkSize = 500;
            $chunkIndex = 0;
            $createdChunkIds = [];

            for ($i = 0; $i < count($chunks); $i += $chunkSize) {
                $chunkContent = implode(' ', array_slice($chunks, $i, $chunkSize));

                $chunk = RagFileChunk::create([
                    'rag_file_id' => $record->id,
                    'chunk_index' => $chunkIndex,
                    'content' => $chunkContent,
                ]);

                $createdChunkIds[] = $chunk->id;
                $chunkIndex++;
            }

            // Dispatch embedding jobs after commit
            foreach ($createdChunkIds as $chunkId) {
                EmbedRagFileChunk::dispatch($chunkId);
            }

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
     */
    public function update(Request $request, $id) {
        try {
            $record = RagFile::find($id);

            if (!$record) {
                return response()->json([
                    'message' => 'Record not found.',
                ], 404);
            }

            // if has file
            if ($request->hasFile('file')) {
                // delete the current file chunks
                $record->ragFileChunks()->delete();

                $filePath = StorageHelper::uploadFile($request->file('file'), 'rag_files');

                if (!$filePath) {
                    return response()->json([
                        'message' => 'Failed to upload file.',
                    ], 400);
                }

                $request->merge([
                    'file_path' => $filePath,
                ]);
            }

            $allowedLocations = json_decode($request->allowed_locations, true);
            $allowedPositions = json_decode($request->allowed_positions, true);
            $allowedWebsites = json_decode($request->allowed_websites, true);

            $request['allowed_locations'] = empty($allowedLocations) ? null : $allowedLocations;
            $request['allowed_positions'] = empty($allowedPositions) ? null : $allowedPositions;
            $request['allowed_websites'] = empty($allowedWebsites) ? null : $allowedWebsites;

            $record->update($request->all());

            // if has file
            if ($request->hasFile('file')) {
                $extractedText = StorageHelper::extractFileContent($record->file_path);

                $chunks = array_filter(preg_split('/\s+/', $extractedText));
                $chunkSize = 500;
                $chunkIndex = 0;
                $createdChunkIds = [];

                for ($i = 0; $i < count($chunks); $i += $chunkSize) {
                    $chunkContent = implode(' ', array_slice($chunks, $i, $chunkSize));

                    $chunk = RagFileChunk::create([
                        'rag_file_id' => $record->id,
                        'chunk_index' => $chunkIndex,
                        'content' => $chunkContent,
                    ]);

                    $createdChunkIds[] = $chunk->id;
                    $chunkIndex++;
                }

                // Dispatch embedding jobs after commit
                foreach ($createdChunkIds as $chunkId) {
                    EmbedRagFileChunk::dispatch($chunkId);
                }
            }

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
     */
    public function destroy($id) {
        try {
            $record = RagFile::find($id);

            if (!$record) {
                return response()->json([
                    'message' => 'Record not found.',
                ], 404);
            }

            // Delete the record
            $record->delete();

            return response()->json($record, 200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'An error occurred',
                'error' => $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Chat with the RAG knowledge base.
     *
     * @return JsonResponse
     *
     * @bodyParam message string required The user's message/question
     * @bodyParam conversation_id string Optional conversation ID to continue an existing conversation
     */
    public function chat(Request $request) {
        $externalId = $request->input('user_id') ?? '0';
        $appSource = $request->input('app_source') ?? 'default';
        $userInput = $request->input('message');
        $chatId = $request->input('chat_id'); // Only provided if continuing an existing chat

        // 1. Determine if this is a new or existing chat
        if ($chatId) {
            // CONTINUING EXISTING CHAT: Find the specific chat
            $chat = Chat::find($chatId);

            if (!$chat) {
                return response()->json([
                    'error' => 'Chat not found',
                    'chat_id' => $chatId,
                ], 404);
            }

            // Optional: Verify this chat belongs to the user
            if ($chat->external_user_id !== $externalId) {
                return response()->json([
                    'error' => 'Unauthorized access to this chat',
                ], 403);
            }
        } else {
            // NEW CHAT: Always create a fresh chat
            $chat = Chat::create([
                'external_user_id' => $externalId,
                'app_source' => $appSource,
                'title' => substr($userInput, 0, 50), // Set title from first message
            ]);
        }

        // 2. Save the User message
        $chat->messages()->create([
            'role' => 'user',
            'content' => $userInput,
        ]);

        // 3. Create agent with chat context and prompt
        $agent = new MegaToolAgent($chat);
        $response = $agent->prompt($userInput);

        // 4. Save the AI response
        $chat->messages()->create([
            'role' => 'assistant',
            'content' => (string) $response,
        ]);

        return response()->json([
            'chat_id' => $chat->id,
            'response' => (string) $response,
            'message_count' => $chat->messages()->count(),
        ]);
    }
}
