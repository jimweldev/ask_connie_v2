<?php

namespace App\Http\Controllers;

use App\Ai\Agents\AskConnieAgent;
use App\Helpers\AiHelper;
use App\Models\Chat\Chat;
use App\Models\Chat\ChatMessage;
use App\Models\External\ExternalUser;
use Illuminate\Http\Request;

class ChatController extends Controller {
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
            $title = AiHelper::generateTitle($message);

            $chat = Chat::create([
                'external_user_id' => $externalUserId,
                'app_source' => $appSource,
                'title' => $title,
            ]);

            $chatId = $chat->id;
        }

        ChatMessage::create([
            'chat_id' => $chatId,
            'external_user_id' => $externalUserId,
            'role' => 'user',
            'content' => $message,
        ]);

        // Store user info in session for tools to access
        session(['external_user_id' => $externalUserId]);
        session(['external_user' => $externalUser->toArray()]);

        $agent = AskConnieAgent::make($externalUser, $chatId);

        $response = $agent->prompt($message);

        $text = $response->text ?? 'Sorry, something went wrong. Please try again.';

        // Check for tool results and format them
        $suggestedActions = [];

        if (isset($response->toolResults) && count($response->toolResults) > 0) {
            foreach ($response->toolResults as $toolResult) {
                $decoded = json_decode($toolResult->result, true);
                
                // Only format if it's a structured ticket response
                if ($decoded && isset($decoded['status'])) {
                    $formatted = $this->formatToolResults([$toolResult]);
                    $text = $formatted['text'];
                    $suggestedActions = $formatted['suggested_actions'] ?? [];
                    break; // ticket tool found, stop checking
                }
                // Otherwise, let $response->text speak (KB tool result)
            }
        }

        // Only store assistant message if it's not empty
        if (!empty($text)) {
            ChatMessage::create([
                'chat_id' => $chatId,
                'external_user_id' => $externalUserId,
                'role' => 'assistant',
                'content' => $text,
            ]);
        }

        // Clear session data
        session()->forget(['external_user_id', 'external_user']);

        return response()->json([
            'response' => $text,
            'chat_id' => $chatId,
            'suggested_actions' => $suggestedActions,
        ], 200);
    }

    public function history(Request $request) {
        $externalUserId = $request->input('external_user_id', '1');
        $appSource = $request->input('app_source', 'default');

        $externalUser = ExternalUser::firstWhere([
            'external_user_id' => $externalUserId,
            'app_source' => $appSource,
        ]);

        if (!$externalUser) {
            return response()->json(['chats' => []], 200);
        }

        $chats = Chat::where('external_user_id', $externalUser->id)
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($chat) {
                return [
                    'id' => $chat->id,
                    'title' => $chat->title ?: 'New Chat',
                    'created_at' => $chat->created_at,
                    'updated_at' => $chat->updated_at,
                ];
            });

        return response()->json(['chats' => $chats], 200);
    }

    public function messages(Request $request, int $chatId) {
        $externalUserId = $request->input('external_user_id', '1');
        $appSource = $request->input('app_source', 'default');

        $externalUser = ExternalUser::firstWhere([
            'external_user_id' => $externalUserId,
            'app_source' => $appSource,
        ]);

        if (!$externalUser) {
            return response()->json(['messages' => []], 200);
        }

        $chat = Chat::where('id', $chatId)
            ->where('external_user_id', $externalUser->id)
            ->firstOrFail();

        $messages = ChatMessage::where('chat_id', $chatId)
            ->orderBy('created_at', 'asc')
            ->get()
            ->map(function($msg) {
                // FIX: Ensure content is always a string
                $content = $msg->content;
                if (is_array($content) || is_object($content)) {
                    $content = json_encode($content);
                }
                
                return [
                    'role'    => $msg->role,
                    'content' => $content,
                ];
            });

        return response()->json([
            'chat_id'  => $chatId,
            'messages' => $messages,
        ]);
    }

    public function delete(Request $request, int $chatId) {
        $externalUserId = $request->input('external_user_id', '1');
        $appSource = $request->input('app_source', 'default');

        $externalUser = ExternalUser::firstWhere([
            'external_user_id' => $externalUserId,
            'app_source' => $appSource,
        ]);

        if (!$externalUser) {
            return response()->json(['message' => 'User not found'], 404);
        }

        $chat = Chat::where('id', $chatId)
            ->where('external_user_id', $externalUser->id)
            ->first();

        if (!$chat) {
            return response()->json(['message' => 'Chat not found'], 404);
        }

        // Delete all messages first (foreign key constraint)
        ChatMessage::where('chat_id', $chatId)->delete();
        
        // Then delete the chat
        $chat->delete();

        return response()->json(['message' => 'Chat deleted successfully'], 200);
    }

    /**
     * Delete all chats for a user
     */
    public function deleteAll(Request $request) {
        $externalUserId = $request->input('external_user_id', '1');
        $appSource = $request->input('app_source', 'default');

        $externalUser = ExternalUser::firstWhere([
            'external_user_id' => $externalUserId,
            'app_source' => $appSource,
        ]);

        if (!$externalUser) {
            return response()->json(['message' => 'User not found'], 404);
        }

        // Get all chat IDs for this user
        $chatIds = Chat::where('external_user_id', $externalUser->id)
            ->pluck('id')
            ->toArray();

        if (empty($chatIds)) {
            return response()->json(['message' => 'No chats found to delete'], 200);
        }

        // Delete all messages for these chats
        ChatMessage::whereIn('chat_id', $chatIds)->delete();
        
        // Delete all chats
        $deletedCount = Chat::where('external_user_id', $externalUser->id)->delete();

        return response()->json([
            'message' => 'All chats deleted successfully',
            'deleted_count' => $deletedCount
        ], 200);
    }

    /**
     * Format tool results for display
     */
    private function formatToolResults($toolResults): array {
        foreach ($toolResults as $toolResult) {
            $decoded = json_decode($toolResult->result, true);
            if (!$decoded) {
                continue;
            }

            // Handle draft preparation
            if (isset($decoded['status']) && $decoded['status'] === 'DRAFT_PREPARED') {
                $data = $decoded['data'];
                $project = $decoded['project'];

                $output = '**[' . strtoupper($project) . "] Draft Ticket Details:**\n\n";

                // --- Payroll Dispute fields ---
                if (isset($data['pay_out_month']) || isset($data['pay_out_date']) || isset($data['pay_out_year'])) {
                    $month  = $data['pay_out_month'] ?? '-';
                    $date   = $data['pay_out_date']  ?? '-';
                    $year   = $data['pay_out_year']   ?? '-';
                    $output .= "- **Payout Period:** {$month} {$date}, {$year}\n";
                }

                // --- Payroll Concern fields ---
                if (isset($data['concern_type'])) {
                    $output .= '- **Concern Type:** ' . $data['concern_type'] . "\n";
                }

                if (isset($data['concern_details'])) {
                    $output .= '- **Concern Details:** ' . $data['concern_details'] . "\n";
                }

                // --- Shared fields (IT / MegaTool / HR / Facilities / Payroll Dispute) ---
                if (isset($data['issue'])) {
                    $output .= '- **Issue Type:** ' . $data['issue'] . "\n";
                }

                if (isset($data['issue_summary'])) {
                    $output .= '- **Summary:** ' . $data['issue_summary'] . "\n";
                }

                if (isset($data['issue_description'])) {
                    $output .= '- **Description:** ' . $data['issue_description'] . "\n";
                }

                $output .= '- **Impact:** '  . ($data['impact']  ?? '-') . "\n";
                $output .= '- **Urgency:** ' . ($data['urgency'] ?? '-') . "\n";

                $output .= "\nWould you like to **submit** this **{$project}** ticket, or would you like to modify anything?";

                return [
                    'text'              => $output,
                    'suggested_actions' => ['Submit', 'Modify', 'Cancel'],
                ];
            }

            // Handle successful submission
            if (isset($decoded['status']) && $decoded['status'] === 'SUCCESS') {
                $project   = $decoded['project'];
                $ticketLink = $decoded['ticket_link'] ?? null;
                $ticketId   = $decoded['id'] ?? null;

                if ($ticketLink) {
                    return [
                        'text'              => "✅ Your **{$project}** ticket has been successfully **submitted**. You can view it here: {$ticketLink}",
                        'suggested_actions' => ['Done'],
                    ];
                } elseif ($ticketId) {
                    return [
                        'text'              => "✅ Your **{$project}** ticket has been successfully **submitted**. Reference ID: **{$ticketId}**",
                        'suggested_actions' => ['Done'],
                    ];
                } else {
                    return [
                        'text'              => "✅ Your **{$project}** ticket has been successfully **submitted**.",
                        'suggested_actions' => ['Done'],
                    ];
                }
            }

            // Handle errors
            if (isset($decoded['status']) && $decoded['status'] === 'ERROR') {
                $project = $decoded['project'] ?? 'Support';

                return [
                    'text'              => "❌ **{$project} Error:** " . ($decoded['message'] ?? 'An unknown error occurred'),
                    'suggested_actions' => ['Try Again', 'Contact Support'],
                ];
            }
        }

        return [
            'text'              => "I've processed your request. How would you like to proceed?",
            'suggested_actions' => ['Continue', 'Start Over'],
        ];
    }
}
