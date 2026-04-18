<?php

namespace App\Ai\Tools;

use App\Helpers\AiHelper;
use App\Models\Rag\RagFileChunk;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Ai\Contracts\Tool;
use Laravel\Ai\Tools\Request;
use Stringable;

class KnowledgeBaseTool implements Tool {
    /**
     * Get the description of the tool's purpose.
     */
    public function description(): Stringable|string {
        return 'Search the internal knowledge base for relevant technical documents and information. Use this tool when you need to find information from uploaded documents.';
    }

    /**
     * Execute the tool.
     */
    public function handle(Request $request): Stringable|string {
        $query = $request['query'];

        if (empty($query)) {
            return 'No query provided.';
        }

        $queryVector = AiHelper::generateEmbeddings($query);
        
        if (empty($queryVector)) {
            return 'Could not generate embeddings for the query.';
        }

        // STEP 1: get candidates via vector search ONLY
        $candidates = RagFileChunk::query()
            ->whereNotNull('embedding')
            ->whereVectorSimilarTo('embedding', $queryVector, 0.3)
            ->with('ragFile')
            ->limit(20) // get more for reranking
            ->get();

        if ($candidates->isEmpty()) {
            return 'No relevant information found in the knowledge base.';
        }

        // STEP 2: simple reranking (lexical boost)
        $queryTerms = explode(' ', strtolower($query));

        $scored = $candidates->map(function ($chunk) use ($queryTerms) {
            $content = strtolower($chunk->content);

            $keywordScore = 0;
            foreach ($queryTerms as $term) {
                if (str_contains($content, $term)) {
                    $keywordScore++;
                }
            }

            return [
                'chunk' => $chunk,
                'score' => $keywordScore,
            ];
        });

        // STEP 3: sort by combined score
        $topChunks = $scored
            ->sortByDesc('score')
            ->take(5)
            ->pluck('chunk');

        // STEP 4: build clean context
        $context = "Knowledge Base Results:\n\n";

        foreach ($topChunks as $chunk) {
            $context .= sprintf(
                "[%s]\n%s\n\n",
                $chunk->ragFile->title,
                $chunk->content
            );
        }

        return $context;
    }

    /**
     * Get the tool's schema definition.
     */
    public function schema(JsonSchema $schema): array {
        return [
            'query' => $schema->string()->required(),
        ];
    }
}
