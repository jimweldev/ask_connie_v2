<?php

namespace App\Models\System;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable([
    'system_dropdown_module_id',
    'label',
])]
class SystemDropdownModuleType extends Model {
    public function system_dropdown_module() {
        return $this->belongsTo(SystemDropdownModule::class);
    }
}
