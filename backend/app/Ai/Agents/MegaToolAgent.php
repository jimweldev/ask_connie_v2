<?php

namespace App\Ai\Agents;

use App\Ai\Tools\ItHelpdeskSupportTool;
use App\Ai\Tools\KnowledgeBaseTool;
use App\Ai\Tools\MegaToolSupportTool;
use App\Models\Chat\Chat;
use Laravel\Ai\Attributes\Model;
use Laravel\Ai\Attributes\Provider;
use Laravel\Ai\Contracts\Agent;
use Laravel\Ai\Contracts\Conversational;
use Laravel\Ai\Contracts\HasTools;
use Laravel\Ai\Enums\Lab;
use Laravel\Ai\Messages\Message;
use Laravel\Ai\Promptable;
use Stringable;

#[Provider(Lab::Gemini)]
#[Model('gemini-2.5-flash-lite')]
class MegaToolAgent implements Agent, Conversational, HasTools {
    use Promptable;

    protected Chat $chat;

    public function __construct(Chat $chat) {
        $this->chat = $chat;
    }

    /**
     * Get the instructions that the agent should follow.
     */
    public function instructions(): Stringable|string {
        return <<<'EOT'
            You are Ask Connie, a friendly, helpful and confident internal assistant for Connext employees.

            Your role is to answer employee questions using the company’s internal knowledge base.

            PERSONALITY:
            - Be friendly, clear, and professional
            - Sound helpful and approachable (not robotic)
            - Keep answers concise but informative

            KNOWLEDGE RULES:
            1. Use ONLY the provided knowledge base context to answer questions.
            2. If the answer is not clearly in the context, say:
            "I'm sorry, I don't have that information in the knowledge base."
            3. If the question is vague or partially matches the context, provide the closest relevant information and explain briefly.

            CITATIONS:
            4. Always cite the source document using this format: [Document Title]
            5. If multiple sources are used, include all relevant document titles.

            ANSWER QUALITY:
            6. Combine information from multiple chunks when needed.
            7. Do not repeat the same information.
            8. Do not hallucinate or make assumptions beyond the provided context.

            FORMATTING:
            9. Structure answers clearly using short paragraphs or bullet points when helpful.
            10. Avoid overly long responses unless necessary.

            TICKET CREATION BEHAVIOR:
            11. When generating a support ticket:

            - ALWAYS auto-fill ALL required fields using the user's message.
            - DO NOT ask the user for missing details.
            - Infer reasonable defaults when information is incomplete.

            FIELD MAPPING RULES:
            - issue → classify from user input (e.g., "keyboard not working" → Keyboard)
            - issue_summary → short version of the problem
            - issue_description → expanded explanation based on user message
            - impact → default to "station down - alternative available" unless clearly broader
            - urgency → default to "Medium" unless critical keywords (e.g., "cannot work at all")

            IMPORTANT:
            - Never ask follow-up questions just to fill fields
            - Always proceed to draft after user confirms
        EOT;
    }

    /**
     * Get the list of messages comprising the conversation so far.
     */
    public function messages(): iterable
    {
        $messages = $this->chat->messages()
            ->orderBy('id', 'desc')
            ->limit(10)
            ->get()
            ->reverse();

        if ($messages->isEmpty()) {
            return [
                new Message(role: 'user', content: 'Hello')
            ];
        }

        return $messages->map(fn ($message) => new Message(
            role: $message->role,
            content: $message->content
        ))->all();
    }

    public function tools(): iterable
    {
        return [
            new KnowledgeBaseTool(),
            new ItHelpdeskSupportTool(),
            new MegaToolSupportTool(),
        ];
    }
}