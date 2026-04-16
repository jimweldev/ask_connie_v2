<?php

namespace App\Ai\Tools;

use Illuminate\Contracts\JsonSchema\JsonSchema;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Laravel\Ai\Contracts\Tool;
use Laravel\Ai\Tools\Request;
use Stringable;

class ItHelpdeskSupportTool implements Tool
{
    public function description(): Stringable|string
    {
        return 'Create IT Helpdesk tickets for hardware/email issues.';
    }

    public function handle(Request $request): Stringable|string
    {
        Log::info('TOOL CALLED', $request->toArray());

        $mode = $request['mode'] ?? 'draft';

        $payload = [
            'issue' => $request['issue'] ?? 'CPU',
            'impact' => $request['impact'] ?? 'station down - alternative available',
            'urgency' => $request['urgency'] ?? 'Medium',
            'issue_summary' => $request['issue_summary'] ?? 'No summary provided',
            'issue_description' => $request['issue_description'] ?? 'No description provided',
        ];

        if ($mode === 'draft') {
            return "🧾 IT Helpdesk Ticket Draft

Issue: {$payload['issue']}
Impact: {$payload['impact']}
Urgency: {$payload['urgency']}
Summary: {$payload['issue_summary']}
Description: {$payload['issue_description']}

Would you like me to submit this ticket?";
        }

        try {
            $response = Http::post(
                'https://test-megaform-api.connextglobal.com/rag/IT%20Helpdesk%20Support',
                $payload
            );

            Log::info('API RESPONSE', ['body' => $response->body()]);

            if ($response->successful()) {
                return '✅ Ticket submitted successfully.';
            }

            return '❌ Failed to submit ticket.';
        } catch (\Throwable $e) {
            Log::error('TOOL ERROR', ['error' => $e->getMessage()]);
            return '❌ System error while submitting ticket.';
        }
    }

    public function schema(JsonSchema $schema): array
    {
        return [
            // ❗ FIX: NOT required anymore
            'mode' => $schema->string()->enum(['draft', 'submit']),

            'issue' => $schema->string()->enum([
                'Mouse', 'Keyboard', 'Monitor', 'CPU', 'UPS', 'Email',
            ]),

            'impact' => $schema->string()->enum([
                'extensive/widespread',
                'business essential',
                'station down - alternative available',
            ]),

            'urgency' => $schema->string()->enum([
                'Critical', 'High', 'Medium', 'Low',
            ]),

            'issue_summary' => $schema->string(),
            'issue_description' => $schema->string(),
        ];
    }
}