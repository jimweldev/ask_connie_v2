<?php

namespace App\Models\System;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable([
    'label',
    'value',
    'notes',
])]
class SystemSetting extends Model {
    //
}
