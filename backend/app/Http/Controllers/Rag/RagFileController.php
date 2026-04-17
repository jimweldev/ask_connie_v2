<?php

namespace App\Http\Controllers\Rag;

use App\Ai\Agents\AskConnieAgent;
use App\Helpers\DynamicLogger;
use App\Helpers\QueryHelper;
use App\Helpers\RagChunker;
use App\Helpers\StorageHelper;
use App\Http\Controllers\Controller;
use App\Jobs\Rag\EmbedRagFileChunk;
use App\Models\Chat\Chat;
use App\Models\Chat\ChatMessage;
use App\Models\External\ExternalUser;
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

            $record = RagFile::create($request->all());

            $extractedText = StorageHelper::extractFileContent($record->file_path);

            $chunks = RagChunker::chunkText($extractedText);

            $createdChunkIds = [];

            foreach ($chunks as $index => $chunkContent) {
                $chunk = RagFileChunk::create([
                    'rag_file_id' => $record->id,
                    'chunk_index' => $index,
                    'content' => $chunkContent,
                    'token_count' => str_word_count($chunkContent),
                    'meta' => json_encode([
                        'source' => $record->title,
                        'chunk' => $index,
                    ]),
                ]);

                $createdChunkIds[] = $chunk->id;
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

            $record->update($request->all());

            // if has file
            if ($request->hasFile('file')) {
                $extractedText = StorageHelper::extractFileContent($record->file_path);

                $chunks = RagChunker::chunkText($extractedText);

                $createdChunkIds = [];

                foreach ($chunks as $index => $chunkContent) {
                    $chunk = RagFileChunk::create([
                        'rag_file_id' => $record->id,
                        'chunk_index' => $index,
                        'content' => $chunkContent,
                        'token_count' => str_word_count($chunkContent),
                        'meta' => json_encode([
                            'source' => $record->title,
                            'chunk' => $index,
                        ]),
                    ]);

                    $createdChunkIds[] = $chunk->id;
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
        $externalUserId = $request->input('external_user_id', '1');
        $appSource = $request->input('app_source', 'default');
        $chatId = $request->input('chat_id');
        $message = $request->input('message');

        $externalUser = ExternalUser::firstOrCreate([
            'external_user_id' => $externalUserId,
            'app_source' => $appSource,
        ]);

        $externalUserId = $externalUser->id;

        if (!$chatId) {
            $chat = Chat::create([
                'external_user_id' => $externalUserId,
                'app_source' => $appSource,
            ]);

            $chatId = $chat->id;
        }

        ChatMessage::create([
            'chat_id' => $chatId,
            'external_user_id' => $externalUserId,
            'role' => 'user',
            'content' => $message,
        ]);

        $agent = AskConnieAgent::make($externalUser, $chatId);

        $response = $agent->prompt($message);

        ChatMessage::create([
            'chat_id' => $chatId,
            'external_user_id' => $externalUserId,
            'role' => 'assistant',
            'content' => $response->text,
        ]);

        return response()->json([
            'response' => $response->text,
            'chat_id' => $chatId,
        ], 200);
    }
}
