<?php

namespace App\Models\Chat;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Chat extends Model {
    use HasFactory;

    protected $table = 'chats';

    protected $fillable = [
        'external_user_id',
        'app_source',
        'title',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function messages(): HasMany {
        return $this->hasMany(ChatMessage::class, 'chat_id');
    }
}
