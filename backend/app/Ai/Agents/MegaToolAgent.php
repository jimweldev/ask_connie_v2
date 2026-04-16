<?php

namespace App\Ai\Agents;

use App\Ai\Tools\KnowledgeBaseTool;
use App\Models\Chat\Chat;
use Laravel\Ai\Attributes\Model;
use Laravel\Ai\Attributes\Provider;
use Laravel\Ai\Attributes\Temperature;
use Laravel\Ai\Contracts\Agent;
use Laravel\Ai\Contracts\Conversational;
use Laravel\Ai\Contracts\HasTools;
use Laravel\Ai\Contracts\Tool;
use Laravel\Ai\Enums\Lab;
use Laravel\Ai\Messages\Message;
use Laravel\Ai\Promptable;
use Stringable;

#[Provider(Lab::Gemini)]
#[Model('gemini-2.5-flash-lite')]
#[Temperature(0.7)]
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
            You are a professional Internal Knowledge Assistant. 
            
            STRICT RULES:
            1. Answer ONLY using the provided tool context. 
            2. If the answer is not in the context, say: "I'm sorry, I don't have information on that in the knowledge base."
            3. Always include the [Source Document Title] at the end of your sentences.
            4. Do not mention the names of tools to the user.
        EOT;
    }

    /**
     * Get the list of messages comprising the conversation so far.
     */
    public function messages(): iterable {
        // Load only the last 10 messages to maintain context without bloat
        $messages = $this->chat->messages()
            ->orderBy('id', 'desc')
            ->limit(10)
            ->get()
            ->reverse(); // Put them back in chronological order

        return $messages->map(function ($message) {
            return new Message(
                role: $message->role,
                content: $message->content
            );
        })->all();
    }

    /**
     * Get the tools available to the agent.
     *
     * @return Tool[]
     */
    public function tools(): iterable {
        return [
            new KnowledgeBaseTool,
        ];
    }
}
