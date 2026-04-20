<?php

namespace App\Models\System;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;

#[Fillable([
    'username',
    'password',
    'notes'
])]
#[Hidden([
    'password',
])]
class SystemUser extends Model {
    //

    protected function casts(): array {
        return [
            'password' => 'hashed',
        ];
    }
}
