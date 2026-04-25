<?php

namespace App\Helpers;

class RagChunker {
    public static function chunkText(string $text, int $chunkSize = 400, int $overlap = 80): array {
        // Normalize text
        $text = preg_replace('/\s+/', ' ', $text);

        // Split by sentences (better than words)
        $sentences = preg_split('/(?<=[.?!]["\']?)\s+(?=[A-Z])/', $text);
        $sentences = array_filter($sentences, fn($s) => trim($s) !== '');

        $chunks = [];
        $currentChunk = [];
        $currentLength = 0;

        foreach ($sentences as $sentence) {
            $sentenceLength = str_word_count($sentence);

            if ($currentLength + $sentenceLength > $chunkSize) {
                $chunks[] = trim(implode(' ', $currentChunk));

                // overlap (take last sentences)
                $overlapChunk = [];
                $overlapLength = 0;

                for ($i = count($currentChunk) - 1; $i >= 0; $i--) {
                    $overlapLength += str_word_count($currentChunk[$i]);
                    array_unshift($overlapChunk, $currentChunk[$i]);

                    if ($overlapLength >= $overlap) {
                        break;
                    }
                }

                $currentChunk = $overlapChunk;
                $currentLength = $overlapLength;
            }

            $currentChunk[] = $sentence;
            $currentLength += $sentenceLength;
        }

        if (!empty($currentChunk)) {
            $chunks[] = implode(' ', $currentChunk);
        }

        return $chunks;
    }
}
