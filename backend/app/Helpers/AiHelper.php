<?php

namespace App\Helpers;

use Laravel\Ai\Embeddings;
use Laravel\Ai\Enums\Lab;

class AiHelper {
    public static function generateEmbeddings($text) {
        $embedding = Embeddings::for([$text])
            ->dimensions(768)
            ->generate(Lab::Gemini, 'gemini-embedding-001');

        return $embedding->embeddings[0];
    }
}
