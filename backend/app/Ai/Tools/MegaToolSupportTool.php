<?php

namespace App\Ai\Tools;

use App\Models\Chat\ChatDraft;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Illuminate\Support\Facades\Http;
use Laravel\Ai\Contracts\Tool;
use Laravel\Ai\Tools\Request;
use Stringable;

class MegaToolSupportTool implements Tool {
    public function __construct(
        private int $chatId,
        private int $externalUserId
    ) {}

    public function description(): Stringable|string {
        return 'Ticketing for MegaTool (formerly MegaForm) related issues such as access errors, bugs, feature requests, time tracker, etc.';
    }

    public function schema(JsonSchema $schema): array {
        return [
            'issue' => $schema->string()->enum([
                'PASSWORD RESET',
                'USER BLOCKED ACCOUNT',
                'Form Access',
                'USER NOT RECEIVING EMAIL',
                'ISSUES/BUGS REPORT',
                'ADDITIONAL FEATURE REQUEST',
                'HELP/TUTORIAL REQUEST',
                'MegaTool Latency',
                'Time Tracker Issues',
                'Sprout Widget Issue',
                'OTHERS'
            ]),
            'impact' => $schema->string()->enum([
                'Extensive / Widespread',
                'Significant / Large',
                'Moderate / Limited',
                'Minor / Localized',
                'Request'
            ]),
            'urgency' => $schema->string()->enum([
                'LOW',
                'MEDIUM',
                'HIGH',
                'CRITICAL'
            ]),
            'issue_summary' => $schema->string(),
            'issue_description' => $schema->string(),
            'confirmed' => $schema->boolean(),
        ];
    }

    public function handle(Request $request): Stringable|string {
        $incoming = $request->all();
        $confirmed = $incoming['confirmed'] ?? false;
        $project = 'MegaTool Support';

        // Load existing draft from DB
        $draftRecord = ChatDraft::where('chat_id', $this->chatId)
            ->where('project', $project)
            ->first();

        $existingDraft = $draftRecord?->data ?? [];

        // Handle description appends intelligently
        if (isset($incoming['issue_description'], $existingDraft['issue_description'])) {
            $newDesc = $incoming['issue_description'];
            $oldDesc = $existingDraft['issue_description'];
            $isAppend = strlen($newDesc) < 50 && !preg_match('/^(My|I|The|My\s)/i', $newDesc);
            $alreadyContains = str_contains($oldDesc, $newDesc);

            if ($isAppend && !$alreadyContains) {
                $incoming['issue_description'] = rtrim($oldDesc, '.').'. '.ucfirst(ltrim($newDesc));
            } elseif ($alreadyContains) {
                unset($incoming['issue_description']);
            }
        }

        // Merge and apply defaults
        $merged = array_merge(
            $existingDraft,
            array_filter($incoming, fn ($v) => !is_null($v) && $v !== '')
        );

        $merged['impact'] ??= 'MODERATE/LIMITED';
        $merged['urgency'] ??= 'MEDIUM';
        $merged['user_id'] ??= $this->externalUserId;

        // Description deduplication and formatting
        if (isset($merged['issue_description'])) {
            $sentences = preg_split('/(?<=[.!?])\s+/', $merged['issue_description'], -1, PREG_SPLIT_NO_EMPTY);
            $unique = [];
            foreach ($sentences as $s) {
                $t = trim($s);
                if (!in_array($t, $unique)) {
                    $unique[] = $t;
                }
            }
            $merged['issue_description'] = implode(' ', $unique);
            $merged['issue_description'] = preg_replace('/My\s+no\s+/i', 'I have no ', $merged['issue_description']);
            if (!preg_match('/^(My|I|The|This)/i', $merged['issue_description'])) {
                $merged['issue_description'] = 'I have '.lcfirst($merged['issue_description']);
            }
        }

        $merged['issue_summary'] = ucfirst($merged['issue_summary'] ?? ($merged['issue'] ?? 'Issue reported'));
        $merged['issue_description'] = ucfirst($merged['issue_description'] ?? $merged['issue_summary']);

        // Persist draft to DB
        ChatDraft::updateOrCreate(
            ['chat_id' => $this->chatId, 'project' => $project],
            [
                'external_user_id' => $this->externalUserId,
                'data' => $merged,
            ]
        );

        if (!$confirmed) {
            return json_encode([
                'status' => 'DRAFT_PREPARED',
                'project' => $project,
                'data' => $merged,
            ]);
        }

        // Guard: if confirmed=true but there was no existing draft, refuse to submit
        if (!$draftRecord) {
            return json_encode([
                'status' => 'ERROR',
                'project' => $project,
                'message' => 'No active draft found. Please start a new ticket.',
            ]);
        }

        // Submit to external API
        $payload = $merged;
        unset($payload['confirmed'], $payload['id'], $payload['created_at'], $payload['updated_at']);

        $response = Http::post('https://test-megaform-api.connextglobal.com/rag/MegaTool%20Support', $payload);

        if ($response->successful()) {
            ChatDraft::where('chat_id', $this->chatId)->where('project', $project)->delete();

            $data = $response->json();

            return json_encode([
                'status' => 'SUCCESS',
                'project' => $project,
                'ticket_link' => $data['ticket_link'] ?? null,
                'message' => $data['message'] ?? 'Ticket created successfully',
                'id' => $data['id'] ?? null,
            ]);
        }

        $errorData = $response->json();
        $errorMessage = $errorData['message'] ?? $errorData['error'] ?? $response->reason();

        return json_encode([
            'status' => 'ERROR',
            'project' => $project,
            'message' => $errorMessage,
        ]);
    }
}