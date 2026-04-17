<?php

namespace App\Models\External;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable([
    'external_user_id',
    'app_source',
])]
class ExternalUser extends Model {
    //
}
