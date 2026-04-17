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
    /**
     * Get the session key for storing draft data
     */
    protected function getSessionKey(): string {
        return 'it_ticket_draft';
    }

    /**
     * Get the project name for display and API
     */
    protected function getProjectName(): string {
        return 'IT Helpdesk Support';
    }

    /**
     * Get the API endpoint URL
     */
    protected function getApiEndpoint(): string {
        // Use %20 to avoid encoding issues
        return 'https://test-megaform-api.connextglobal.com/rag/IT%20Helpdesk%20Support';
    }

    /**
     * Get default values for the tool's fields
     */
    protected function getDefaultValues(): array {
        return [
            'impact' => 'station down - alternative available',
            'urgency' => 'HIGH',
        ];
    }

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
        Log::info('ItHelpdeskSupportTool handle called');

        $incoming = $request->all();
        $confirmed = $incoming['confirmed'] ?? false;
        $existingDraft = Session::get($this->getSessionKey(), []);

        Log::info('ItHelpdeskSupportTool incoming data', $incoming);
        Log::info('ItHelpdeskSupportTool existing draft', $existingDraft);

        // Handle description appends intelligently
        if (isset($incoming['issue_description']) && isset($existingDraft['issue_description'])) {
            $newDesc = $incoming['issue_description'];
            $oldDesc = $existingDraft['issue_description'];

            // Check if the new description is just an addition (not a full replacement)
            // Heuristic: if new text is short (< 50 chars) or doesn't start with typical sentence starters
            $isAppend = strlen($newDesc) < 50 &&
                        !preg_match('/^(My|I|The|My\s)/i', $newDesc);

            // Also check if the new text is already contained in the old description
            $alreadyContains = str_contains($oldDesc, $newDesc);

            if ($isAppend && !$alreadyContains) {
                // Append with proper spacing
                $incoming['issue_description'] = rtrim($oldDesc, '.').'. '.ucfirst(ltrim($newDesc));
            } elseif ($alreadyContains) {
                // If already contained, use the old description to avoid duplication
                unset($incoming['issue_description']);
            }
        }

        // Merge incoming data with existing draft, filtering out null/empty values
        $merged = array_merge(
            $existingDraft,
            array_filter($incoming, fn ($v) => !is_null($v) && $v !== '')
        );

        // Apply default values for missing fields
        $defaults = $this->getDefaultValues();
        foreach ($defaults as $key => $defaultValue) {
            $merged[$key] ??= $defaultValue;
        }

        // Inject user_id from session
        $userId = Session::get('user_id');
        if ($userId && !isset($merged['user_id'])) {
            $merged['user_id'] = $userId;
        }

        // Inject external_user_id if available
        $externalUserId = Session::get('external_user_id');
        if ($externalUserId && !isset($merged['external_user_id'])) {
            $merged['external_user_id'] = $externalUserId;
        }

        // --- FIXED DESCRIPTION FORMATTING ---
        if (isset($merged['issue_description'])) {
            // Remove any duplicate sentences (simple deduplication)
            $sentences = preg_split('/(?<=[.!?])\s+/', $merged['issue_description'], -1, PREG_SPLIT_NO_EMPTY);
            $uniqueSentences = [];
            foreach ($sentences as $sentence) {
                $trimmed = trim($sentence);
                if (!in_array($trimmed, $uniqueSentences)) {
                    $uniqueSentences[] = $trimmed;
                }
            }
            $merged['issue_description'] = implode(' ', $uniqueSentences);

            // Clean up awkward "My no" pattern
            $merged['issue_description'] = preg_replace('/My\s+no\s+/i', 'I have no ', $merged['issue_description']);
            $merged['issue_description'] = preg_replace('/My\s+(\w+)/i', 'My $1', $merged['issue_description']);

            // Ensure it starts properly
            if (!preg_match('/^(My|I|The|This)/i', $merged['issue_description'])) {
                $merged['issue_description'] = 'I have '.lcfirst($merged['issue_description']);
            }
        }

        // --- CAPITALIZE SUMMARY AND DESCRIPTION ---
        if (isset($merged['issue_summary']) && !empty($merged['issue_summary'])) {
            $merged['issue_summary'] = ucfirst($merged['issue_summary']);
        }
        if (isset($merged['issue_description']) && !empty($merged['issue_description'])) {
            $merged['issue_description'] = ucfirst($merged['issue_description']);
        }

        // --- FALLBACK FOR BLANK SUMMARY/DESCRIPTION ---
        if (empty($merged['issue_summary'])) {
            $merged['issue_summary'] = $merged['issue'] ?? 'Issue reported';
            $merged['issue_summary'] = ucfirst($merged['issue_summary']);
        }
        if (empty($merged['issue_description'])) {
            $merged['issue_description'] = $merged['issue_summary'] ?? 'No description provided';
            $merged['issue_description'] = ucfirst($merged['issue_description']);
        }
        // ---------------------------------------------

        // Store the draft in session
        Session::put($this->getSessionKey(), $merged);

        // If not confirmed, return draft
        if (!$confirmed) {
            Log::info('ItHelpdeskSupportTool returning draft');

            return json_encode([
                'status' => 'DRAFT_PREPARED',
                'project' => $this->getProjectName(),
                'data' => $merged,
            ]);
        }

        // --- PREPARE PAYLOAD FOR API ---
        $payload = $merged;
        unset($payload['confirmed']);
        unset($payload['id'], $payload['created_at'], $payload['updated_at']);

        Log::info('ItHelpdeskSupportTool submitting payload', $payload);

        // Submit the ticket
        $response = Http::post($this->getApiEndpoint(), $payload);

        if ($response->successful()) {
            Session::forget($this->getSessionKey());

            $responseData = $response->json();
            Log::info('ItHelpdeskSupportTool submission successful', $responseData);

            return json_encode([
                'status' => 'SUCCESS',
                'project' => $this->getProjectName(),
                'ticket_link' => $responseData['ticket_link'] ?? null,
                'message' => $responseData['message'] ?? 'Ticket created successfully',
                'id' => $responseData['id'] ?? null,
            ]);
        }

        // Log the full error for debugging
        Log::error('Ticket submission failed', [
            'project' => $this->getProjectName(),
            'endpoint' => $this->getApiEndpoint(),
            'payload' => $payload,
            'response_status' => $response->status(),
            'response_body' => $response->body(),
        ]);

        // Extract meaningful error message
        $errorMessage = $response->reason();
        $responseData = $response->json();
        if ($responseData && isset($responseData['message'])) {
            $errorMessage = $responseData['message'];
        } elseif ($responseData && isset($responseData['error'])) {
            $errorMessage = $responseData['error'];
        }

        return json_encode([
            'status' => 'ERROR',
            'project' => $this->getProjectName(),
            'message' => $errorMessage,
        ]);
    }
}
