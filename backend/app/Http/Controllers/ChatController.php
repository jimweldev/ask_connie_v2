<?php

namespace App\Http\Controllers;

use App\Ai\Agents\AskConnieAgent;
use App\Models\Chat\Chat;
use App\Models\Chat\ChatMessage;
use App\Models\External\ExternalUser;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

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

        // Store user info in session for tools to access
        session(['external_user_id' => $externalUserId]);
        session(['external_user' => $externalUser->toArray()]);

        $agent = AskConnieAgent::make($externalUser, $chatId);

        $response = $agent->prompt($message);

        $text = $response->text ?? 'Sorry, something went wrong. Please try again.';

        // Check for tool results and format them
        $suggestedActions = [];
        $toolCalled = false;

        if (isset($response->toolResults) && count($response->toolResults) > 0) {
            $toolCalled = true;
            $formatted = $this->formatToolResults($response->toolResults);
            $text = $formatted['text'];
            $suggestedActions = $formatted['suggested_actions'] ?? [];
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

                $output = '**['.strtoupper($project)."] Draft Ticket Details:**\n\n";

                // Only show fields that exist in the schema
                if (isset($data['issue'])) {
                    $output .= '- **Issue Type:** '.$data['issue']."\n";
                }
                $output .= '- **Impact:** '.($data['impact'] ?? '-')."\n";
                $output .= '- **Urgency:** '.($data['urgency'] ?? '-')."\n";
                $output .= '- **Summary:** '.($data['issue_summary'] ?? '-')."\n";
                $output .= '- **Description:** '.($data['issue_description'] ?? '-')."\n";

                $output .= "\nWould you like to **submit** this **{$project}** ticket, or would you like to modify anything?";

                return [
                    'text' => $output,
                    'suggested_actions' => ['Submit', 'Modify', 'Cancel'],
                ];
            }

            // Handle successful submission
            if (isset($decoded['status']) && $decoded['status'] === 'SUCCESS') {
                $project = $decoded['project'];
                $ticketLink = $decoded['ticket_link'] ?? null;
                $ticketId = $decoded['id'] ?? null;

                if ($ticketLink) {
                    return [
                        'text' => "✅ Your **{$project}** ticket has been successfully **submitted**. You can view it here: {$ticketLink}",
                        'suggested_actions' => ['Done'],
                    ];
                } elseif ($ticketId) {
                    return [
                        'text' => "✅ Your **{$project}** ticket has been successfully **submitted**. Reference ID: **{$ticketId}**",
                        'suggested_actions' => ['Done'],
                    ];
                } else {
                    return [
                        'text' => "✅ Your **{$project}** ticket has been successfully **submitted**.",
                        'suggested_actions' => ['Done'],
                    ];
                }
            }

            // Handle errors
            if (isset($decoded['status']) && $decoded['status'] === 'ERROR') {
                $project = $decoded['project'] ?? 'Support';

                return [
                    'text' => "❌ **{$project} Error:** ".($decoded['message'] ?? 'An unknown error occurred'),
                    'suggested_actions' => ['Try Again', 'Contact Support'],
                ];
            }
        }

        return [
            'text' => "I've processed your request. How would you like to proceed?",
            'suggested_actions' => ['Continue', 'Start Over'],
        ];
    }
}
