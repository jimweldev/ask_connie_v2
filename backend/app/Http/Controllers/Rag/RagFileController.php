<?php

namespace App\Http\Controllers\Rag;

use App\Ai\Agents\MegaToolAgent;
use App\Helpers\DynamicLogger;
use App\Helpers\QueryHelper;
use App\Helpers\StorageHelper;
use App\Http\Controllers\Controller;
use App\Jobs\Rag\EmbedRagFileChunk;
use App\Models\Agent\AgentConversation;
use App\Models\Rag\RagFile;
use App\Models\Rag\RagFileChunk;
use App\Models\User\User;
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
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     * 
     * @bodyParam message string required The user's message/question
     * @bodyParam conversation_id string Optional conversation ID to continue an existing conversation
     */
    public function chat(Request $request) {
        try {
            $userId = 1;

            $request->validate([
                'message' => 'required|string',
                'conversation_id' => 'nullable|string',
            ]);

            $message = $request->input('message');
            $conversationId = $request->input('conversation_id');
            $user = User::find($userId);

            // Create agent instance
            $agent = new MegaToolAgent();

            // If we have a user, associate the conversation with them
            if ($user) {
                $agent = $agent->forUser($user);
            }

            // Continue existing conversation or start new one
            if ($conversationId) {
                $agent = $agent->continue($conversationId, as: $user);
            }

            // Prompt the agent with the user's message
            $response = $agent->prompt($message);

            return response()->json([
                'success' => true,
                'response' => (string) $response,
                'conversation_id' => $response->conversationId,
                'usage' => $response->usage ?? null,
            ], 200);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            $this->logger->error('Chat error: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while processing your request',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get conversation history for a user.
     * 
     * @param Request $request
     * @param string|null $conversationId
     * @return \Illuminate\Http\JsonResponse
     */
    public function getConversations(Request $request, $conversationId = null) {
        try {
            $userId = 1;
            $user = User::find($userId);

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not authenticated',
                ], 401);
            }

            // If conversation ID is provided, get specific conversation messages
            if ($conversationId) {
                $conversation = AgentConversation::with('messages')
                    ->where('id', $conversationId)
                    ->where('user_id', $user->id)
                    ->first();

                if (!$conversation) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Conversation not found',
                    ], 404);
                }

                return response()->json([
                    'success' => true,
                    'conversation' => $conversation,
                    'messages' => $conversation->messages,
                ], 200);
            }

            // Otherwise, get all conversations for the user
            $conversations = AgentConversation::where('user_id', $user->id)
                ->orderBy('updated_at', 'desc')
                ->get();

            return response()->json([
                'success' => true,
                'conversations' => $conversations,
            ], 200);

        } catch (\Exception $e) {
            $this->logger->error('Get conversations error: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'An error occurred',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Delete a conversation.
     * 
     * @param Request $request
     * @param string $conversationId
     * @return \Illuminate\Http\JsonResponse
     */
    public function deleteConversation(Request $request, $conversationId) {
        try {
            $userId = 1;
            $user = User::find($userId);

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not authenticated',
                ], 401);
            }

            $conversation = AgentConversation::where('id', $conversationId)
                ->where('user_id', $userId)
                ->first();

            if (!$conversation) {
                return response()->json([
                    'success' => false,
                    'message' => 'Conversation not found',
                ], 404);
            }

            $conversation->delete();

            return response()->json([
                'success' => true,
                'message' => 'Conversation deleted successfully',
            ], 200);

        } catch (\Exception $e) {
            $this->logger->error('Delete conversation error: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'An error occurred',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
