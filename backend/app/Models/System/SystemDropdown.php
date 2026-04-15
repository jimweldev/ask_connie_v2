<?php

namespace App\Models\System;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable([
    'label',
    'module',
    'type',
    'order',
    'properties',
])]
class SystemDropdown extends Model {
    protected $casts = [
        'properties' => 'array',
    ];
}
