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

        // Generate embeddings for the query
        $queryVector = AiHelper::generateEmbeddings($query);

        // Build the query with similarity search
        $queryBuilder = RagFileChunk::query()
            // Only bring back chunks that are actually relevant (threshold)
            ->whereVectorSimilarTo('embedding', $queryVector, 0.5)
            ->orWhere('content', 'LIKE', "%{$query}%") // Simple keyword fallback
            ->with('ragFile');

        // Execute the query
        $results = $queryBuilder->limit(5)->get();

        if ($results->isEmpty()) {
            return 'No relevant information found in the knowledge base.';
        }

        // Format results for the agent
        $formattedResults = "Here are the relevant documents from the knowledge base:\n\n";

        foreach ($results as $result) {
            $formattedResults .= sprintf(
                "Document: %s\nContent: %s\n---\n",
                $result->ragFile->title,
                $result->content
            );
        }

        return $formattedResults;
    }

    /**
     * Get the tool's schema definition.
     */
    public function schema(JsonSchema $schema): array {
        return [
            'query' => $schema->string()
                ->description('The search query to look up in the knowledge base')
                ->required(),
        ];
    }
}
