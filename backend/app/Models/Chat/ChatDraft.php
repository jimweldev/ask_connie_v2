<?php

namespace App\Models\Chat;

use Illuminate\Database\Eloquent\Model;

class ChatDraft extends Model {
    protected $fillable = ['chat_id', 'external_user_id', 'project', 'data'];

    protected $casts = [
        'data' => 'array',
    ];
}
