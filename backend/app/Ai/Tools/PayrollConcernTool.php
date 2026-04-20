<?php

namespace App\Ai\Tools;

use App\Models\Chat\ChatDraft;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Illuminate\Support\Facades\Http;
use Laravel\Ai\Contracts\Tool;
use Laravel\Ai\Tools\Request;
use Stringable;

class PayrollConcernTool implements Tool {
    public function __construct(
        private int $chatId,
        private int $externalUserId
    ) {}

    public function description(): Stringable|string {
        return 'Ticketing for payroll related concerns such as loan deduction authorities, Sprout login OTP issues, and other payroll requests or concerns.';
    }

    public function schema(JsonSchema $schema): array {
        return [
            'concern_type' => $schema->string()->enum([
                'Authority to deduct HDMF loan acquired from previous employer',
                'Authority to deduct SSS loan acquired from previous employer',
                'I am not receiveing the email-based OTP for Sprout Login',
                'Other Request/Concern',
            ]),
            'concern_details' => $schema->string(),
            'impact' => $schema->string()->enum([
                'payroll concern',
                'loan deduction issue',
                'system access issue',
                'other concern',
            ]),
            'urgency' => $schema->string()->enum([
                'critical',
                'high',
                'medium',
                'low',
            ]),
            'confirmed' => $schema->boolean(),
        ];
    }

    public function handle(Request $request): Stringable|string {
        $incoming = $request->all();
        $confirmed = $incoming['confirmed'] ?? false;
        $project = 'Payroll Concern';

        // Load existing draft from DB
        $draftRecord = ChatDraft::where('chat_id', $this->chatId)
            ->where('project', $project)
            ->first();

        $existingDraft = $draftRecord?->data ?? [];

        // Handle concern_details appends intelligently
        if (isset($incoming['concern_details'], $existingDraft['concern_details'])) {
            $newDetails = $incoming['concern_details'];
            $oldDetails = $existingDraft['concern_details'];
            $isAppend = strlen($newDetails) < 50 && !preg_match('/^(My|I|The|My\s)/i', $newDetails);
            $alreadyContains = str_contains($oldDetails, $newDetails);

            if ($isAppend && !$alreadyContains) {
                $incoming['concern_details'] = rtrim($oldDetails, '.').'. '.ucfirst(ltrim($newDetails));
            } elseif ($alreadyContains) {
                unset($incoming['concern_details']);
            }
        }

        // Merge and apply defaults
        $merged = array_merge(
            $existingDraft,
            array_filter($incoming, fn ($v) => !is_null($v) && $v !== '')
        );

        $merged['impact'] ??= 'other concern';
        $merged['urgency'] ??= 'medium';
        $merged['user_id'] ??= $this->externalUserId;

        // concern_details deduplication and formatting
        if (isset($merged['concern_details'])) {
            $sentences = preg_split('/(?<=[.!?])\s+/', $merged['concern_details'], -1, PREG_SPLIT_NO_EMPTY);
            $unique = [];
            foreach ($sentences as $s) {
                $t = trim($s);
                if (!in_array($t, $unique)) {
                    $unique[] = $t;
                }
            }
            $merged['concern_details'] = implode(' ', $unique);
            $merged['concern_details'] = preg_replace('/My\s+no\s+/i', 'I have no ', $merged['concern_details']);
            if (!preg_match('/^(My|I|The|This)/i', $merged['concern_details'])) {
                $merged['concern_details'] = 'I have '.lcfirst($merged['concern_details']);
            }
        }

        $merged['concern_details'] = ucfirst($merged['concern_details'] ?? ($merged['concern_type'] ?? 'Concern reported'));

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

        $response = Http::post('https://test-megaform-api.connextglobal.com/payroll-dispute/request/concern', $payload);

        if ($response->successful()) {
            // Delete draft on success
            ChatDraft::where('chat_id', $this->chatId)->where('project', $project)->delete();

            $data = $response->json();

            return json_encode([
                'status' => 'SUCCESS',
                'project' => $project,
                'ticket_link' => $data['ticket_link'] ?? null,
                'message' => $data['message'] ?? 'Concern submitted successfully',
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