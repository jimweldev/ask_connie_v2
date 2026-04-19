<?php

namespace App\Ai\Tools;

use App\Models\Chat\ChatDraft;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Illuminate\Support\Facades\Http;
use Laravel\Ai\Contracts\Tool;
use Laravel\Ai\Tools\Request;
use Stringable;

class PayrollDisputeTool implements Tool {
    public function __construct(
        private int $chatId,
        private int $externalUserId
    ) {}

    public function description(): Stringable|string {
        return 'Ticketing for payroll disputes such as salary discrepancies, missing payouts, incorrect amounts, late payments, and deduction issues.';
    }

    public function schema(JsonSchema $schema): array {
        return [
            'pay_out_month' => $schema->string()->enum([
                'January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December',
                '13th Month',
            ]),
            'pay_out_date' => $schema->string()->enum([
                '10', '25', 'N/A',
            ]),
            'pay_out_year' => $schema->string()->enum([
                '2025', '2026', '2027',
            ]),
            'issue_summary' => $schema->string(),
            'issue_description' => $schema->string(),
            'impact' => $schema->string()->enum([
                'salary discrepancy',
                'missing payout',
                'incorrect amount',
                'late payment',
                'deduction issue',
                'other',
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

    /**
     * Determine the latest payout date based on today's date.
     * Payouts are on the 10th and 25th of each month.
     * Always return the most recent payout that has already passed.
     */
    private function resolveLatestPayout(): array {
        $now = now();
        $day = (int) $now->format('j');
        $month = (int) $now->format('n');
        $year = (int) $now->format('Y');

        $monthNames = [
            1 => 'January', 2 => 'February', 3 => 'March', 4 => 'April',
            5 => 'May', 6 => 'June', 7 => 'July', 8 => 'August',
            9 => 'September', 10 => 'October', 11 => 'November', 12 => 'December',
        ];

        if ($day >= 25) {
            // Latest payout is the 25th of this month
            return [
                'pay_out_date' => '25',
                'pay_out_month' => $monthNames[$month],
                'pay_out_year' => (string) $year,
            ];
        } elseif ($day >= 10) {
            // Latest payout is the 10th of this month
            return [
                'pay_out_date' => '10',
                'pay_out_month' => $monthNames[$month],
                'pay_out_year' => (string) $year,
            ];
        } else {
            // Latest payout was the 25th of the previous month
            $prevMonth = $month === 1 ? 12 : $month - 1;
            $prevYear = $month === 1 ? $year - 1 : $year;
            return [
                'pay_out_date' => '25',
                'pay_out_month' => $monthNames[$prevMonth],
                'pay_out_year' => (string) $prevYear,
            ];
        }
    }

    public function handle(Request $request): Stringable|string {
        $incoming = $request->all();
        $confirmed = $incoming['confirmed'] ?? false;
        $project = 'Payroll Dispute';

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

        // Apply latest payout defaults if not specified
        $latestPayout = $this->resolveLatestPayout();
        $merged['pay_out_month'] ??= $latestPayout['pay_out_month'];
        $merged['pay_out_date'] ??= $latestPayout['pay_out_date'];
        $merged['pay_out_year'] ??= $latestPayout['pay_out_year'];

        $merged['impact'] ??= 'other';
        $merged['urgency'] ??= 'medium';
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

        $merged['issue_summary'] = ucfirst($merged['issue_summary'] ?? ($merged['impact'] ?? 'Payroll dispute reported'));
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

        // Submit to external API
        $payload = $merged;
        unset($payload['confirmed'], $payload['id'], $payload['created_at'], $payload['updated_at']);

        $response = Http::post('https://test-megaform-api.connextglobal.com/payroll-dispute', $payload);

        if ($response->successful()) {
            // Delete draft on success
            ChatDraft::where('chat_id', $this->chatId)->where('project', $project)->delete();

            $data = $response->json();

            return json_encode([
                'status' => 'SUCCESS',
                'project' => $project,
                'ticket_link' => $data['ticket_link'] ?? null,
                'message' => $data['message'] ?? 'Dispute submitted successfully',
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