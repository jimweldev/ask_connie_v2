<?php

namespace App\Ai\Tools;

use Illuminate\Contracts\JsonSchema\JsonSchema;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Session;
use Laravel\Ai\Contracts\Tool;
use Laravel\Ai\Tools\Request;
use Stringable;

class ItHelpdeskSupportTool implements Tool {

    public function description(): Stringable|string {
        return 'Manages IT Helpdesk tickets with draft, update, submit, and cancel operations.';
    }

    public function schema(JsonSchema $schema): array {
        return [
            'issue' => $schema->string()->enum(['MOUSE', 'KEYBOARD', 'MONITOR', 'CPU', 'UPS', 'EMAIL', 'NETWORK']),
            'impact' => $schema->string()->enum(['extensive/widespread', 'business essential', 'station down - alternative available']),
            'urgency' => $schema->string()->enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']),
            'issue_summary' => $schema->string(),
            'issue_description' => $schema->string(),
            'confirmed' => $schema->boolean(),
        ];
    }

    public function handle(Request $request): Stringable|string {
        $incoming = $request->all();
        $confirmed = $incoming['confirmed'] ?? false;
        $existingDraft = Session::get('it_ticket_draft', []);

        // Handle description appends intelligently
        if (isset($incoming['issue_description']) && isset($existingDraft['issue_description'])) {
            $newDesc = $incoming['issue_description'];
            $oldDesc = $existingDraft['issue_description'];

            $isAppend = strlen($newDesc) < 50 &&
                        !preg_match('/^(My|I|The|My\s)/i', $newDesc);

            $alreadyContains = str_contains($oldDesc, $newDesc);

            if ($isAppend && !$alreadyContains) {
                $incoming['issue_description'] = rtrim($oldDesc, '.').'. '.ucfirst(ltrim($newDesc));
            } elseif ($alreadyContains) {
                unset($incoming['issue_description']);
            }
        }

        // Merge incoming data with existing draft, filtering out null/empty values
        $merged = array_merge(
            $existingDraft,
            array_filter($incoming, fn ($v) => !is_null($v) && $v !== '')
        );

        // Apply default values for missing fields
        $merged['impact'] ??= 'station down - alternative available';
        $merged['urgency'] ??= 'HIGH';

        // Inject user_id from session
        $userId = Session::get('user_id');
        if ($userId && !isset($merged['user_id'])) {
            $merged['user_id'] = $userId;
        }

        // Inject external_user_id if available
        $externalUserId = Session::get('external_user_id');
        if ($externalUserId && !isset($merged['external_user_id'])) {
            $merged['user_id'] = $externalUserId;
        }

        // Description formatting
        if (isset($merged['issue_description'])) {
            $sentences = preg_split('/(?<=[.!?])\s+/', $merged['issue_description'], -1, PREG_SPLIT_NO_EMPTY);
            $uniqueSentences = [];
            foreach ($sentences as $sentence) {
                $trimmed = trim($sentence);
                if (!in_array($trimmed, $uniqueSentences)) {
                    $uniqueSentences[] = $trimmed;
                }
            }
            $merged['issue_description'] = implode(' ', $uniqueSentences);
            $merged['issue_description'] = preg_replace('/My\s+no\s+/i', 'I have no ', $merged['issue_description']);
            $merged['issue_description'] = preg_replace('/My\s+(\w+)/i', 'My $1', $merged['issue_description']);

            if (!preg_match('/^(My|I|The|This)/i', $merged['issue_description'])) {
                $merged['issue_description'] = 'I have '.lcfirst($merged['issue_description']);
            }
        }

        // Capitalize summary and description
        if (!empty($merged['issue_summary'])) {
            $merged['issue_summary'] = ucfirst($merged['issue_summary']);
        }
        if (!empty($merged['issue_description'])) {
            $merged['issue_description'] = ucfirst($merged['issue_description']);
        }

        // Fallback for blank summary/description
        if (empty($merged['issue_summary'])) {
            $merged['issue_summary'] = ucfirst($merged['issue'] ?? 'Issue reported');
        }
        if (empty($merged['issue_description'])) {
            $merged['issue_description'] = ucfirst($merged['issue_summary'] ?? 'No description provided');
        }

        // Store the draft in session
        Session::put('it_ticket_draft', $merged);

        // If not confirmed, return draft
        if (!$confirmed) {
            return json_encode([
                'status' => 'DRAFT_PREPARED',
                'project' => 'IT Helpdesk Support',
                'data' => $merged,
            ]);
        }

        // Prepare payload for API
        $payload = $merged;
        unset($payload['confirmed'], $payload['id'], $payload['created_at'], $payload['updated_at']);

        $response = Http::post('https://test-megaform-api.connextglobal.com/rag/IT%20Helpdesk%20Support', $payload);

        if ($response->successful()) {
            Session::forget('it_ticket_draft');

            $responseData = $response->json();

            return json_encode([
                'status' => 'SUCCESS',
                'project' => 'IT Helpdesk Support',
                'ticket_link' => $responseData['ticket_link'] ?? null,
                'message' => $responseData['message'] ?? 'Ticket created successfully',
                'id' => $responseData['id'] ?? null,
            ]);
        }

        $errorMessage = $response->reason();
        $responseData = $response->json();
        if ($responseData && isset($responseData['message'])) {
            $errorMessage = $responseData['message'];
        } elseif ($responseData && isset($responseData['error'])) {
            $errorMessage = $responseData['error'];
        }

        return json_encode([
            'status' => 'ERROR',
            'project' => 'IT Helpdesk Support',
            'message' => $errorMessage,
        ]);
    }
}