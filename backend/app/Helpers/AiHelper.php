<?php

namespace App\Helpers;

use Laravel\Ai\Embeddings;
use Laravel\Ai\Enums\Lab;
use function Laravel\Ai\agent;

class AiHelper {
    public static function generateEmbeddings($text) {
        $embedding = Embeddings::for([$text])
            ->dimensions(768)
            ->generate(Lab::Gemini, 'gemini-embedding-001');

        return $embedding->embeddings[0];
    }

    public static function generateTitle($text) {
        $title = agent(instructions: 'You are a professional editor. Summarize the user message into a concise, title-case headline. Do not use quotes, punctuation at the end, or preamble. Limit to 3-5 words.')
                ->prompt(
                    'Create a title for this conversation: ' . $text,
                    provider: Lab::Gemini,
                    model: 'gemini-2.5-flash-lite',
                );

        return $title;
    }
}
