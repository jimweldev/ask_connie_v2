<?php

namespace App\Models\Agent;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable([
    'user_id',
    'title',
])]
class AgentConversation extends Model {
    //
}
