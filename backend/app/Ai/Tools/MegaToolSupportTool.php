<?php

namespace App\Ai\Tools;

use Illuminate\Contracts\JsonSchema\JsonSchema;
use Illuminate\Support\Facades\Http;
use Laravel\Ai\Contracts\Tool;
use Laravel\Ai\Tools\Request;
use Stringable;

class MegaToolSupportTool implements Tool {
    public function description(): Stringable|string {
        return 'Create MegaTool (Megafrom) support tickets for login, access, or system issues.';
    }

    public function handle(Request $request): Stringable|string {
        $mode = $request['mode'] ?? 'draft';

        $payload = [
            'issue' => $request['issue'],
            'impact' => $request['impact'] ?? 'OTHERS',
            'urgency' => $request['urgency'] ?? 'Medium',
            'issue_summary' => $request['issue_summary'],
            'issue_description' => $request['issue_description'],
        ];

        if ($mode === 'draft') {
            return "Here is your MegaTool support ticket draft:\n\n".
                json_encode($payload, JSON_PRETTY_PRINT);
        }

        $response = Http::post(
            'https://test-megaform-api.connextglobal.com/rag/MegaTool%20Support',
            $payload
        );

        if ($response->successful()) {
            return '✅ Your MegaTool support ticket has been submitted successfully.';
        }

        return '❌ Failed to submit MegaTool ticket. Please try again.';
    }

    public function schema(JsonSchema $schema): array {
        return [
            'mode' => $schema->string()->enum(['draft', 'submit'])->required(),

            'issue' => $schema->string()->enum([
                'MEGAFORM PARTIALLY INACCESSIBLE',
                'STAFF CANNOT RESET PASSWORD',
                'STAFF CANNOT LOGIN',
                'STAFF BLOCKED LOGIN RESET',
                'NEW STAFF MEGAFORM ACCESS REQUEST',
            ])->required(),

            'impact' => $schema->string()->enum([
                'WEB APP/SITE DOWN',
                'ACCESS ERROR',
                'ISSUES/BUG/ERROR',
                'RECORD MANAGEMENT',
                'TUTORIAL/HELP',
                'OTHERS',
                'REQUEST',
                'MODERATE/LIMITED',
            ]),

            'urgency' => $schema->string()->enum([
                'Critical', 'High', 'Medium', 'Low',
            ]),

            'issue_summary' => $schema->string()->required(),
            'issue_description' => $schema->string()->required(),
        ];
    }
}
