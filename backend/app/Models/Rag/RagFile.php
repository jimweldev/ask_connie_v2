<?php

namespace App\Models\Rag;

use Illuminate\Database\Eloquent\Model;

class RagFile extends Model {
    protected $guarded = [
        'id',
        'created_at',
        'updated_at',
    ];

    public function ragFileChunks() {
        return $this->hasMany(RagFileChunk::class);
    }
}
