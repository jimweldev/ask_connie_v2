<?php

namespace App\Ai\Tools;

use App\Models\Chat\ChatDraft;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Illuminate\Support\Facades\Http;
use Laravel\Ai\Contracts\Tool;
use Laravel\Ai\Tools\Request;
use Stringable;

class FacilitiesAndLogisticsSupportTool implements Tool {
    public function __construct(
        private int $chatId,
        private int $externalUserId
    ) {}

    public function description(): Stringable|string {
        return 'Ticketing for facilities and logistics related requests such as room setup, logistics, vehicle appointments, repairs and maintenance, space planning, printing and mailing, permits, safety or hazard incidents, and other facilities concerns.';
    }

    public function schema(JsonSchema $schema): array {
        return [
            'issue' => $schema->string()->enum([
                'ROOM SETUP & ARRANGEMENTS',
                'LOGISTICS REQUEST',
                'CONNEXT VEHICLE APPOINTMENT (ANGELES SITE)',
                'REPAIRS, REPLACEMENT AND MAINTENANCE',
                'SPACE PLANNING',
                'PRINTING AND MAILING',
                'PERMITS AND GATEPASS',
                'SAFETY / HAZARD / INCIDENT',
                'OTHER FACILITIES CONCERN AND REQUEST',
            ]),
            'impact' => $schema->string()->enum([
                'NORMAL',
                'URGENT',
            ]),
            'urgency' => $schema->string()->enum([
                'LOW',
                'MEDIUM',
                'CRITICAL',
            ]),
            'issue_summary' => $schema->string(),
            'issue_description' => $schema->string(),
            'confirmed' => $schema->boolean(),
        ];
    }

    public function handle(Request $request): Stringable|string {
        $incoming = $request->all();
        $confirmed = $incoming['confirmed'] ?? false;
        $project = 'Facilities and Logistics Support';

        // Load existing draft from DB instead of session
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

        $merged['impact'] ??= 'NORMAL';
        $merged['urgency'] ??= 'LOW';
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

        // Persist draft to DB (upsert so modifying re-uses same row)
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

        // Submit to external API
        $payload = $merged;
        unset($payload['confirmed'], $payload['id'], $payload['created_at'], $payload['updated_at']);

        $response = Http::post('https://test-megaform-api.connextglobal.com/rag/Facilities%20and%20Logistics%20Support', $payload);

        if ($response->successful()) {
            // Delete draft on success
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