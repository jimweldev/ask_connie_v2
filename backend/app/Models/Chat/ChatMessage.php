<?php

namespace App\Models\Chat;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ChatMessage extends Model {
    use HasFactory;

    protected $table = 'chat_messages';

    protected $fillable = [
        'chat_id',
        'role',
        'content',
        'external_user_id',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function chat(): BelongsTo {
        return $this->belongsTo(Chat::class, 'chat_id');
    }
}
