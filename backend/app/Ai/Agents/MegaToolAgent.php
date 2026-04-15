<?php

namespace App\Ai\Agents;

use App\Ai\Tools\KnowledgeBaseTool;
use Laravel\Ai\Attributes\Model;
use Laravel\Ai\Attributes\Provider;
use Laravel\Ai\Attributes\Temperature;
use Laravel\Ai\Concerns\RemembersConversations;
use Laravel\Ai\Contracts\Agent;
use Laravel\Ai\Contracts\Conversational;
use Laravel\Ai\Contracts\HasTools;
use Laravel\Ai\Contracts\Tool;
use Laravel\Ai\Enums\Lab;
use Laravel\Ai\Promptable;
use Stringable;

#[Provider(Lab::Gemini)]
#[Model('gemini-2.5-flash-lite')]
#[Temperature(0.7)]
class MegaToolAgent implements Agent, Conversational, HasTools
{
    use Promptable, RemembersConversations;

    /**
     * Get the instructions that the agent should follow.
     */
    public function instructions(): Stringable|string
    {
        return 'You are a helpful assistant that answers questions based on the company\'s internal knowledge base. '
            . 'When asked questions, use the knowledge base tool to find relevant information. '
            . 'Always cite which document the information came from. '
            . 'If the knowledge base doesn\'t contain the answer, say so honestly.';
    }

    /**
     * Get the tools available to the agent.
     *
     * @return Tool[]
     */
    public function tools(): iterable
    {
        return [
            new KnowledgeBaseTool(),
        ];
    }
}